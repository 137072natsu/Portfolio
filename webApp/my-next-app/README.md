## route.ts
```ts
import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

/*
 * mysql2はNode.js環境で動作させる。
 * Edge Runtimeではmysql2を利用できないため、
 * Route HandlerをNode.js Runtimeに固定する。
 */
export const runtime = 'nodejs';

/*
 * 毎回DBの最新情報を取得するため、
 * Next.jsによるRoute Handlerのキャッシュを無効化する。
 */
export const dynamic = 'force-dynamic';

/*
 * assetsテーブルから取得する1行分の型。
 *
 * RowDataPacketを継承することで、
 * mysql2のquery()に型として渡せる。
 */
interface AssetRow extends RowDataPacket {
  id: number;
  name: string;
  class: string;
  game_path: string;
  thumbnail_path: string | null;
  revision: number;
  commit_message: string | null;
  created_at: string;
}

/*
 * MySQLへのConnection Poolを作成する。
 *
 * .env.local または Docker Compose のenvironmentで、
 *
 * DATABASE_HOST
 * DATABASE_USER
 * DATABASE_PASSWORD
 * DATABASE_NAME
 *
 * を設定しておく。
 *
 * Docker ComposeでMySQLサービス名が「db」の場合は、
 * DATABASE_HOST=db
 * とする。
 */
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  /*
   * 使用可能なConnectionがなければ、
   * 空くまで待機する。
   */
  waitForConnections: true,

  /*
   * 同時に保持するConnection数。
   */
  connectionLimit: 10,

  /*
   * Connection待ちのリクエスト数を制限しない。
   */
  queueLimit: 0,
});

/*
 * GET /api/assets
 *
 * assetsテーブルに保存されている
 * 全Asset・全Revisionを取得する。
 *
 * page.tsx側で、
 *
 * 1. 同じgame_pathの最新Revision
 *    → TreeView
 *
 * 2. 同じgame_pathの全Revision
 *    → Timeline
 *
 * に分けて利用する。
 */
export async function GET() {
  try {
    /*
     * DBからAsset履歴を取得する。
     *
     * game_path:
     *   Assetを一意に識別するために利用する。
     *
     * revision DESC:
     *   同じAssetでは新しいRevisionから順番にする。
     *
     * DATE_FORMAT:
     *   MySQLのDATETIMEをブラウザ側で扱いやすい
     *   "YYYY-MM-DD HH:mm:ss" に変換する。
     *
     * Dateとしてそのまま返すと、
     * Node.js → JSON変換時にUTCへ変換される可能性があるため、
     * 今回は文字列として返している。
     */
    const [rows] = await pool.query<AssetRow[]>(`
      SELECT
        id,
        name,
        \`class\`,
        game_path,
        thumbnail_path,
        revision,
        commit_message,
        DATE_FORMAT(
          created_at,
          '%Y-%m-%d %H:%i:%s'
        ) AS created_at
      FROM assets
      ORDER BY
        game_path ASC,
        revision DESC
    `);

    /*
     * 正常に取得できた場合、
     * JSONとしてpage.tsxへ返す。
     */
    return NextResponse.json(rows);
  } catch (error) {
    /*
     * DB接続エラーやSQLエラーなどが発生した場合。
     */
    console.error('Asset取得エラー:', error);

    return NextResponse.json(
      {
        message: 'Asset情報の取得に失敗しました。',
      },
      {
        status: 500,
      },
    );
  }
}
```

## page.tsx
```tsx
'use client';

import * as React from 'react';

import { animated, useSpring } from '@react-spring/web';

import { alpha, styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderRounded from '@mui/icons-material/FolderRounded';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import HistoryIcon from '@mui/icons-material/History';

import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

import {
  useTreeItem,
  UseTreeItemParameters,
} from '@mui/x-tree-view/useTreeItem';

import {
  TreeItemCheckbox,
  TreeItemIconContainer,
  TreeItemLabel,
} from '@mui/x-tree-view/TreeItem';

import { TreeItemIcon } from '@mui/x-tree-view/TreeItemIcon';
import { TreeItemProvider } from '@mui/x-tree-view/TreeItemProvider';
import { TreeItemDragAndDropOverlay } from '@mui/x-tree-view/TreeItemDragAndDropOverlay';

import { useTreeItemModel } from '@mui/x-tree-view/hooks';

import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

/* =========================================================
   DBから取得するAssetデータ
========================================================= */

/*
 * /api/assets から返されるAsset情報の型。
 *
 * DBのカラム名と同じ名前にしているため、
 * JSON取得後に変換せずそのまま利用できる。
 */
type AssetData = {
  id: number;
  name: string;
  class: string;
  game_path: string;
  thumbnail_path: string | null;
  revision: number;
  commit_message: string | null;
  created_at: string;
};

/* =========================================================
   TreeView
========================================================= */

type FileType =
  | 'image'
  | 'pdf'
  | 'doc'
  | 'video'
  | 'folder'
  | 'pinned'
  | 'trash';

/*
 * RichTreeViewに渡すデータ。
 *
 * gamePath:
 *   Assetノードの場合のみ設定する。
 *
 * assetClass:
 *   Unreal EngineのAsset classを保持する。
 */
type ExtendedTreeItemProps = {
  id: string;
  label: string;

  fileType?: FileType;

  gamePath?: string;
  assetClass?: string;

  children?: ExtendedTreeItemProps[];
};

/* =========================================================
   Unreal Asset Class → TreeView Icon
========================================================= */

/*
 * Unreal Engineのclass名から、
 * TreeViewで表示するアイコン種類を決める。
 *
 * DBに入っているclass名によって
 * 条件は必要に応じて追加できる。
 */
function getFileTypeFromAssetClass(
  assetClass: string,
): FileType {
  const className =
    assetClass.toLowerCase();

  /*
   * Texture系。
   */
  if (
    className.includes('texture') ||
    className.includes('image')
  ) {
    return 'image';
  }

  /*
   * Materialも視覚系Assetとして
   * ImageIconを利用する。
   */
  if (className.includes('material')) {
    return 'image';
  }

  /*
   * Movie / Media系。
   */
  if (
    className.includes('media') ||
    className.includes('movie') ||
    className.includes('video')
  ) {
    return 'video';
  }

  /*
   * その他Blueprint、
   * StaticMesh、SkeletalMeshなどは
   * 一旦Documentアイコンにする。
   */
  return 'doc';
}

/* =========================================================
   最新Revisionだけを取得
========================================================= */

/*
 * TreeViewには同じAssetをRevisionごとに表示せず、
 * 最新Revisionだけを1件表示したい。
 *
 * game_pathをAssetの一意な識別子として、
 * revisionが最大のデータだけを残す。
 */
function getLatestAssets(
  assets: AssetData[],
): AssetData[] {
  const latestMap =
    new Map<string, AssetData>();

  for (const asset of assets) {
    const current =
      latestMap.get(asset.game_path);

    /*
     * 初登場のgame_pathなら登録する。
     */
    if (!current) {
      latestMap.set(
        asset.game_path,
        asset,
      );

      continue;
    }

    /*
     * 既に登録されているものより
     * revisionが新しければ置き換える。
     */
    if (
      asset.revision >
      current.revision
    ) {
      latestMap.set(
        asset.game_path,
        asset,
      );
    }
  }

  /*
   * TreeViewが安定して表示されるように
   * game_path順にソートする。
   */
  return Array.from(
    latestMap.values(),
  ).sort((a, b) =>
    a.game_path.localeCompare(
      b.game_path,
    ),
  );
}

/* =========================================================
   game_path → Folder Path
========================================================= */

/*
 * 例:
 *
 * /Game/Characters/Player/BP_Player
 *
 * ↓
 *
 * [
 *   "Game",
 *   "Characters",
 *   "Player"
 * ]
 *
 * 最後のBP_Player部分はAssetなので、
 * Folder一覧から除外する。
 */
function getFolderParts(
  asset: AssetData,
): string[] {
  const normalizedPath =
    asset.game_path
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

  const parts =
    normalizedPath
      .split('/')
      .filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  /*
   * Unreal Object Pathが
   *
   * BP_Player.BP_Player
   *
   * のような形式の場合にも対応する。
   */
  const lastPart =
    parts[parts.length - 1];

  const assetNameFromPath =
    lastPart.split('.')[0];

  /*
   * game_pathの最後がAsset名なら、
   * Folderとして扱わない。
   */
  if (
    assetNameFromPath ===
    asset.name
  ) {
    parts.pop();
  }

  return parts;
}

/* =========================================================
   Asset一覧 → TreeViewデータ
========================================================= */

/*
 * DBから取得したAsset一覧を、
 * game_pathをもとにDirectory構造へ変換する。
 *
 * 例:
 *
 * /Game/Characters/BP_Player
 * /Game/Characters/SK_Player
 * /Game/Materials/M_Player
 *
 * ↓
 *
 * Game
 * ├─ Characters
 * │  ├─ BP_Player
 * │  └─ SK_Player
 * │
 * └─ Materials
 *    └─ M_Player
 */
function createTreeItems(
  assets: AssetData[],
): ExtendedTreeItemProps[] {
  const root:
    ExtendedTreeItemProps[] = [];

  for (const asset of assets) {
    const folderParts =
      getFolderParts(asset);

    /*
     * 現在追加しようとしている階層。
     * 最初はroot。
     */
    let currentChildren =
      root;

    /*
     * Folder IDを作成するため、
     * 現在のPathを保持する。
     */
    let currentPath = '';

    for (
      const folderName
      of folderParts
    ) {
      currentPath +=
        `/${folderName}`;

      /*
       * Asset IDと衝突しないように
       * folder: をPrefixにつける。
       */
      const folderId =
        `folder:${currentPath}`;

      /*
       * 同じFolderが既に存在するか確認する。
       */
      let folder =
        currentChildren.find(
          (item) =>
            item.id === folderId,
        );

      /*
       * Folderがまだ無ければ新しく作成する。
       */
      if (!folder) {
        folder = {
          id: folderId,
          label: folderName,
          fileType: 'folder',
          children: [],
        };

        currentChildren.push(
          folder,
        );
      }

      /*
       * 次の階層へ移動する。
       */
      if (!folder.children) {
        folder.children = [];
      }

      currentChildren =
        folder.children;
    }

    /*
     * 最後に実際のAssetを追加する。
     *
     * Asset IDは、
     *
     * asset:/Game/Characters/BP_Player
     *
     * のような形式にする。
     */
    currentChildren.push({
      id: `asset:${asset.game_path}`,

      label: asset.name,

      gamePath:
        asset.game_path,

      assetClass:
        asset.class,

      fileType:
        getFileTypeFromAssetClass(
          asset.class,
        ),
    });
  }

  /*
   * Folderを上、
   * Assetを下に表示するためのソート。
   */
  const sortTree = (
    items:
      ExtendedTreeItemProps[],
  ) => {
    items.sort((a, b) => {
      const aFolder =
        Boolean(a.children);

      const bFolder =
        Boolean(b.children);

      /*
       * FolderとAssetなら
       * Folderを先にする。
       */
      if (aFolder !== bFolder) {
        return aFolder ? -1 : 1;
      }

      /*
       * 同じ種類なら名前順。
       */
      return a.label.localeCompare(
        b.label,
      );
    });

    /*
     * 子Folderについても
     * 再帰的にソートする。
     */
    for (const item of items) {
      if (item.children) {
        sortTree(item.children);
      }
    }
  };

  sortTree(root);

  return root;
}

/* =========================================================
   TreeView Style
========================================================= */

function DotIcon() {
  return (
    <Box
      sx={{
        width: 6,
        height: 6,

        borderRadius: '50%',

        bgcolor: 'warning.main',

        display: 'inline-block',

        verticalAlign: 'middle',

        mx: 1,
      }}
    />
  );
}

declare module 'react' {
  interface CSSProperties {
    '--tree-view-color'?: string;
    '--tree-view-bg-color'?: string;
  }
}

/*
 * TreeItem全体。
 */
const TreeItemRoot =
  styled('li')(
    ({ theme }) => ({
      listStyle: 'none',

      margin: 0,
      padding: 0,

      outline: 0,

      color:
        theme.palette.grey[400],

      ...theme.applyStyles(
        'light',
        {
          color:
            theme.palette
              .grey[800],
        },
      ),
    }),
  );

/*
 * TreeItemのクリック可能部分。
 */
const TreeItemContent =
  styled('div')(
    ({ theme }) => ({
      padding:
        theme.spacing(0.5),

      paddingRight:
        theme.spacing(1),

      paddingLeft: `calc(
        ${theme.spacing(1)}
        + var(--TreeView-itemChildrenIndentation)
        * var(--TreeView-itemDepth)
      )`,

      width: '100%',

      boxSizing:
        'border-box',

      position:
        'relative',

      display: 'flex',

      alignItems:
        'center',

      gap: theme.spacing(1),

      cursor: 'pointer',

      WebkitTapHighlightColor:
        'transparent',

      flexDirection:
        'row-reverse',

      borderRadius:
        theme.spacing(0.7),

      marginBottom:
        theme.spacing(0.5),

      marginTop:
        theme.spacing(0.5),

      fontWeight: 500,

      /*
       * 展開中Folderの色。
       */
      '&[data-expanded]:not([data-focused], [data-selected]) .labelIcon':
        {
          color:
            theme.palette
              .primary.dark,

          ...theme.applyStyles(
            'light',
            {
              color:
                theme.palette
                  .primary.main,
            },
          ),
        },

      /*
       * 選択されたAsset。
       */
      '&[data-focused], &[data-selected]':
        {
          backgroundColor:
            theme.palette
              .primary.dark,

          color:
            theme.palette
              .primary
              .contrastText,

          ...theme.applyStyles(
            'light',
            {
              backgroundColor:
                theme.palette
                  .primary.main,
            },
          ),
        },

      /*
       * Mouse Hover。
       */
      '&:not([data-focused], [data-selected]):hover':
        {
          backgroundColor:
            alpha(
              theme.palette
                .primary.main,
              0.1,
            ),

          ...theme.applyStyles(
            'light',
            {
              color:
                theme.palette
                  .primary.main,
            },
          ),
        },
    }),
  );

/*
 * Folderを開閉するときのCollapse。
 */
const CustomCollapse =
  styled(Collapse)({
    padding: 0,
  });

const AnimatedCollapse =
  animated(CustomCollapse);

/*
 * Folder展開・閉じる際に
 * React SpringでAnimationをつける。
 */
function TransitionComponent(
  props: TransitionProps,
) {
  const style =
    useSpring({
      to: {
        opacity:
          props.in ? 1 : 0,

        transform:
          `translate3d(
            0,
            ${
              props.in
                ? 0
                : 20
            }px,
            0
          )`,
      },
    });

  return (
    <AnimatedCollapse
      style={style}
      {...props}
    />
  );
}

const TreeItemLabelText =
  styled(Typography)({
    color: 'inherit',
    fontWeight: 500,
  });

/* =========================================================
   Custom Tree Label
========================================================= */

interface CustomLabelProps {
  children:
    React.ReactNode;

  icon?:
    React.ElementType;

  expandable?:
    boolean;
}

/*
 * Folder/Assetの
 * Icon + 名前を表示する。
 */
function CustomLabel({
  icon: Icon,
  expandable,
  children,
  ...other
}: CustomLabelProps) {
  return (
    <TreeItemLabel
      {...other}
      sx={{
        display: 'flex',

        alignItems:
          'center',
      }}
    >
      {Icon && (
        <Box
          component={Icon}
          className="labelIcon"
          sx={{
            color:
              'inherit',

            mr: 1,

            fontSize:
              '1.2rem',
          }}
        />
      )}

      <TreeItemLabelText
        variant="body2"
      >
        {children}
      </TreeItemLabelText>

      {expandable && (
        <DotIcon />
      )}
    </TreeItemLabel>
  );
}

/* =========================================================
   File Type → Icon
========================================================= */

function getIconFromFileType(
  fileType: FileType,
) {
  switch (fileType) {
    case 'image':
      return ImageIcon;

    case 'pdf':
      return PictureAsPdfIcon;

    case 'doc':
      return ArticleIcon;

    case 'video':
      return VideoCameraBackIcon;

    case 'folder':
      return FolderRounded;

    case 'pinned':
      return FolderOpenIcon;

    case 'trash':
      return DeleteIcon;

    default:
      return ArticleIcon;
  }
}

/* =========================================================
   Custom TreeItem
========================================================= */

interface CustomTreeItemProps
  extends
    Omit<
      UseTreeItemParameters,
      'rootRef'
    >,
    Omit<
      React.HTMLAttributes<HTMLLIElement>,
      'onFocus'
    > {}

/*
 * MUIの標準TreeItemを拡張して、
 * Assetの種類に応じたIconなどを表示する。
 */
const CustomTreeItem =
  React.forwardRef(
    function CustomTreeItem(
      props:
        CustomTreeItemProps,

      ref:
        React.Ref<HTMLLIElement>,
    ) {
      const {
        id,
        itemId,
        label,
        disabled,
        children,
        ...other
      } = props;

      /*
       * MUI TreeView内部で必要なPropsを取得する。
       */
      const {
        getContextProviderProps,
        getRootProps,
        getContentProps,
        getIconContainerProps,
        getCheckboxProps,
        getLabelProps,
        getGroupTransitionProps,
        getDragAndDropOverlayProps,
        status,
      } = useTreeItem({
        id,
        itemId,
        children,
        label,
        disabled,
        rootRef: ref,
      });

      /*
       * createTreeItems()で追加した
       * fileTypeなどの追加情報を取得する。
       */
      const item =
        useTreeItemModel<
          ExtendedTreeItemProps
        >(itemId)!;

      let icon:
        React.ElementType =
        ArticleIcon;

      /*
       * 子要素がある場合は
       * DirectoryなのでFolderIcon。
       */
      if (
        status.expandable
      ) {
        icon =
          FolderRounded;
      } else if (
        item.fileType
      ) {
        /*
         * Assetの場合は
         * classに応じたIcon。
         */
        icon =
          getIconFromFileType(
            item.fileType,
          );
      }

      return (
        <TreeItemProvider
          {...getContextProviderProps()}
        >
          <TreeItemRoot
            {...getRootProps(
              other,
            )}
          >
            <TreeItemContent
              {...getContentProps()}
            >
              <TreeItemIconContainer
                {...getIconContainerProps()}
              >
                <TreeItemIcon
                  status={
                    status
                  }
                />
              </TreeItemIconContainer>

              <TreeItemCheckbox
                {...getCheckboxProps()}
              />

              <CustomLabel
                {...getLabelProps({
                  icon,

                  expandable:
                    status.expandable &&
                    status.expanded,
                })}
              />

              <TreeItemDragAndDropOverlay
                {...getDragAndDropOverlayProps()}
              />
            </TreeItemContent>

            {children && (
              <TransitionComponent
                {...getGroupTransitionProps()}
              />
            )}
          </TreeItemRoot>
        </TreeItemProvider>
      );
    },
  );

/* =========================================================
   Thumbnail
========================================================= */

/*
 * thumbnail_pathから画像を表示する。
 *
 * thumbnail_pathがnull、
 * または画像取得に失敗した場合は
 * ImageIconへフォールバックする。
 *
 * このコードではthumbnail_pathが、
 *
 * /assets/BP_Player.png
 *
 * のようにブラウザから参照可能なURLである前提。
 */
function AssetThumbnail({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [
    imageError,
    setImageError,
  ] =
    React.useState(false);

  /*
   * URLがない、または画像取得失敗。
   */
  if (
    !src ||
    imageError
  ) {
    return (
      <Box
        sx={{
          width: 140,
          minWidth: 140,
          height: 140,

          display: 'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          bgcolor:
            'action.hover',
        }}
      >
        <ImageIcon
          sx={{
            fontSize: 48,

            color:
              'text.secondary',
          }}
        />
      </Box>
    );
  }

  /*
   * 正常なThumbnail。
   */
  return (
    <CardMedia
      component="img"
      image={src}
      alt={alt}
      onError={() =>
        setImageError(true)
      }
      sx={{
        width: 140,
        minWidth: 140,
        height: 140,

        objectFit:
          'cover',

        bgcolor:
          'action.hover',
      }}
    />
  );
}

/* =========================================================
   Date
========================================================= */

/*
 * route.tsから、
 *
 * 2026-09-14 12:34:56
 *
 * 形式で返された日時を、
 *
 * date = 2026-09-14
 * time = 12:34
 *
 * に分ける。
 */
function splitCreatedAt(
  createdAt: string,
) {
  if (!createdAt) {
    return {
      date: '-',
      time: '',
    };
  }

  const [
    date,
    rawTime = '',
  ] =
    createdAt.split(' ');

  return {
    date,

    /*
     * 秒はTimelineでは不要なので、
     * HH:mmだけ表示する。
     */
    time:
      rawTime.slice(0, 5),
  };
}

/* =========================================================
   Timeline
========================================================= */

function AssetHistoryTimeline({
  histories,
}: {
  histories: AssetData[];
}) {
  /*
   * 履歴がない場合。
   */
  if (
    histories.length === 0
  ) {
    return (
      <Box
        sx={{
          minHeight: 300,

          display: 'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          border: 1,

          borderColor:
            'divider',

          borderRadius: 2,
        }}
      >
        <Typography
          color="text.secondary"
        >
          このアセットには
          履歴がありません
        </Typography>
      </Box>
    );
  }

  return (
    <Timeline
      position="right"
      sx={{
        m: 0,
        p: 0,

        /*
         * MUI Timelineが自動で追加する
         * 左側スペースを削除する。
         */
        '& .MuiTimelineItem-root:before':
          {
            flex: 0,
            padding: 0,
          },
      }}
    >
      {histories.map(
        (
          history,
          index,
        ) => {
          /*
           * created_atを
           * DateとTimeに分割する。
           */
          const {
            date,
            time,
          } =
            splitCreatedAt(
              history.created_at,
            );

          return (
            <TimelineItem
              key={
                history.id
              }
              sx={{
                minHeight:
                  180,
              }}
            >
              {/* =========================
                  左側: 更新日時
              ========================= */}

              <TimelineOppositeContent
                sx={{
                  flex:
                    '0 0 170px',

                  pt: 2.2,

                  pr: 3,

                  textAlign:
                    'right',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight:
                      600,
                  }}
                >
                  {date}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {time}
                </Typography>
              </TimelineOppositeContent>

              {/* =========================
                  中央: Timeline
              ========================= */}

              <TimelineSeparator>
                <TimelineDot
                  color="primary"
                  sx={{
                    mt: 2,
                  }}
                >
                  <HistoryIcon
                    sx={{
                      fontSize:
                        16,
                    }}
                  />
                </TimelineDot>

                {index !==
                  histories.length -
                    1 && (
                  <TimelineConnector />
                )}
              </TimelineSeparator>

              {/* =========================
                  右側: Asset
              ========================= */}

              <TimelineContent
                sx={{
                  pt: 0.5,
                  pb: 4,
                  pl: 3,
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    display:
                      'flex',

                    width: '100%',

                    maxWidth: 720,

                    minHeight:
                      140,

                    overflow:
                      'hidden',

                    cursor:
                      'pointer',

                    transition:
                      'transform 0.15s ease, box-shadow 0.15s ease',

                    '&:hover':
                      {
                        transform:
                          'translateY(-2px)',

                        boxShadow:
                          4,
                      },
                  }}
                >
                  {/* Thumbnail */}

                  <AssetThumbnail
                    src={
                      history.thumbnail_path
                    }
                    alt={
                      history.name
                    }
                  />

                  <CardContent
                    sx={{
                      flex: 1,

                      display:
                        'flex',

                      flexDirection:
                        'column',

                      justifyContent:
                        'center',

                      px: 3,
                    }}
                  >
                    {/* Asset名 + Revision */}

                    <Box
                      sx={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        flexWrap:
                          'wrap',

                        gap: 1,

                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight:
                            700,
                        }}
                      >
                        {
                          history.name
                        }
                      </Typography>

                      <Chip
                        label={`#${history.revision}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />

                      {/* Unreal Asset Class */}

                      <Chip
                        label={
                          history.class
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Commit Message */}

                    <Typography
                      variant="body1"
                      sx={{
                        mb: 1,
                      }}
                    >
                      {history.commit_message ??
                        'コミットメッセージなし'}
                    </Typography>

                    {/* Unreal game_path */}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        wordBreak:
                          'break-all',
                      }}
                    >
                      {
                        history.game_path
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          );
        },
      )}
    </Timeline>
  );
}

/* =========================================================
   Page
========================================================= */

export default function Page() {
  /*
   * DBから取得した
   * 全Asset・全Revisionを保存する。
   */
  const [
    assets,
    setAssets,
  ] =
    React.useState<
      AssetData[]
    >([]);

  /*
   * TreeViewで現在選択されている
   * Asset ID。
   *
   * asset:/Game/Characters/BP_Player
   *
   * のような値になる。
   */
  const [
    selectedItemId,
    setSelectedItemId,
  ] =
    React.useState<
      string | null
    >(null);

  /*
   * API取得中フラグ。
   */
  const [
    loading,
    setLoading,
  ] =
    React.useState(true);

  /*
   * API取得失敗時の
   * Error Message。
   */
  const [
    error,
    setError,
  ] =
    React.useState<
      string | null
    >(null);

  /* =======================================================
     DB → API → Browser
  ======================================================= */

  React.useEffect(() => {
    /*
     * ComponentがUnmountされたときに
     * fetchを中断できるようにする。
     */
    const controller =
      new AbortController();

    /*
     * Asset一覧を取得する。
     */
    async function fetchAssets() {
      try {
        setLoading(true);

        setError(null);

        /*
         * route.tsのGET()を呼び出す。
         */
        const response =
          await fetch(
            '/api/assets',
            {
              /*
               * DBの変更を即座に反映したいので、
               * ブラウザ/Next.js Cacheを利用しない。
               */
              cache:
                'no-store',

              signal:
                controller.signal,
            },
          );

        /*
         * HTTP 200系でなければ
         * Error扱い。
         */
        if (!response.ok) {
          throw new Error(
            'Asset情報の取得に失敗しました。',
          );
        }

        /*
         * JSONをTypeScriptの
         * AssetData[]として受け取る。
         */
        const data:
          AssetData[] =
          await response.json();

        /*
         * DBデータをStateへ保存する。
         */
        setAssets(data);
      } catch (err) {
        /*
         * AbortControllerによる
         * 意図的な中断なら無視する。
         */
        if (
          err instanceof
            DOMException &&
          err.name ===
            'AbortError'
        ) {
          return;
        }

        console.error(err);

        setError(
          'Asset情報を取得できませんでした。',
        );
      } finally {
        /*
         * Loading表示を終了する。
         */
        setLoading(false);
      }
    }

    fetchAssets();

    /*
     * Component破棄時に
     * fetchをキャンセルする。
     */
    return () => {
      controller.abort();
    };
  }, []);

  /* =======================================================
     最新Revision
  ======================================================= */

  /*
   * TreeViewには最新Revisionのみ表示する。
   *
   * assets自体は全Revisionを保持している。
   */
  const latestAssets =
    React.useMemo(
      () =>
        getLatestAssets(
          assets,
        ),
      [assets],
    );

  /* =======================================================
     TreeView生成
  ======================================================= */

  /*
   * 最新RevisionのAsset一覧から、
   * game_pathに沿ってTreeViewを生成する。
   */
  const treeItems =
    React.useMemo(
      () =>
        createTreeItems(
          latestAssets,
        ),
      [latestAssets],
    );

  /* =======================================================
     初期選択
  ======================================================= */

  React.useEffect(() => {
    /*
     * 既に何か選択されているなら
     * 変更しない。
     */
    if (
      selectedItemId
    ) {
      return;
    }

    /*
     * Assetが1件以上あれば、
     * 最初のAssetを初期選択する。
     */
    if (
      latestAssets.length >
      0
    ) {
      setSelectedItemId(
        `asset:${latestAssets[0].game_path}`,
      );
    }
  }, [
    latestAssets,
    selectedItemId,
  ]);

  /* =======================================================
     選択Assetのgame_path
  ======================================================= */

  /*
   * TreeView ID:
   *
   * asset:/Game/Characters/BP_Player
   *
   * ↓
   *
   * /Game/Characters/BP_Player
   *
   * に戻す。
   */
  const selectedGamePath =
    selectedItemId?.startsWith(
      'asset:',
    )
      ? selectedItemId.slice(
          'asset:'.length,
        )
      : null;

  /* =======================================================
     選択Assetの全履歴
  ======================================================= */

  /*
   * assetsには全Revisionが入っているため、
   * game_pathが一致するものだけ取り出す。
   */
  const histories =
    React.useMemo(() => {
      if (
        !selectedGamePath
      ) {
        return [];
      }

      return assets
        .filter(
          (asset) =>
            asset.game_path ===
            selectedGamePath,
        )
        /*
         * 新しいRevisionが上に来るようにする。
         */
        .sort(
          (a, b) =>
            b.revision -
            a.revision,
        );
    }, [
      assets,
      selectedGamePath,
    ]);

  /*
   * 最新RevisionからAsset名を取得。
   */
  const selectedAssetName =
    histories.length > 0
      ? histories[0].name
      : null;

  /* =======================================================
     Loading
  ======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight:
            '100vh',

          display: 'flex',

          justifyContent:
            'center',

          alignItems:
            'center',

          gap: 2,
        }}
      >
        <CircularProgress />

        <Typography>
          Assetを読み込んでいます...
        </Typography>
      </Box>
    );
  }

  /* =======================================================
     Page
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight:
          '100vh',

        width: '100%',

        p: {
          xs: 2,
          md: 4,
        },

        bgcolor:
          'background.default',
      }}
    >
      {/* ===============================
          Header
      =============================== */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Unreal Asset Browser
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
        >
          AssetとRevision履歴を表示します
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ===============================
          API Error
      =============================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
          }}
        >
          {error}
        </Alert>
      )}

      {/* ===============================
          DBにAssetが存在しない場合
      =============================== */}

      {!error &&
        assets.length ===
          0 && (
          <Alert
            severity="info"
          >
            DBにAssetが登録されていません。
          </Alert>
        )}

      {/* ===============================
          Main
      =============================== */}

      {!error &&
        assets.length >
          0 && (
          <Box
            sx={{
              display: 'flex',

              flexDirection: {
                xs: 'column',
                md: 'row',
              },

              alignItems:
                'flex-start',

              gap: 4,
            }}
          >
            {/* ===========================
                左側 TreeView
            =========================== */}

            <Box
              sx={{
                width: {
                  xs: '100%',
                  md: 320,
                },

                flexShrink: 0,

                border: 1,

                borderColor:
                  'divider',

                borderRadius: 2,

                bgcolor:
                  'background.paper',

                p: 2,

                /*
                 * Treeが長くなった場合、
                 * Page全体が極端に伸びないようにする。
                 */
                maxHeight:
                  'calc(100vh - 180px)',

                overflowY:
                  'auto',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight:
                    700,

                  mb: 2,

                  px: 1,
                }}
              >
                Asset Tree
              </Typography>

              <RichTreeView
                /*
                 * DBから動的生成した
                 * Treeデータ。
                 */
                items={
                  treeItems
                }

                /*
                 * 現在選択中のAsset。
                 */
                selectedItems={
                  selectedItemId
                }

                /*
                 * TreeViewでAssetをクリックしたとき。
                 */
                onSelectedItemsChange={(
                  _event,
                  itemId,
                ) => {
                  /*
                   * 今回はsingle selectionなので、
                   * 通常はstring。
                   *
                   * 型上Arrayの可能性も考慮する。
                   */
                  if (
                    Array.isArray(
                      itemId,
                    )
                  ) {
                    setSelectedItemId(
                      itemId[0] ??
                        null,
                    );

                    return;
                  }

                  setSelectedItemId(
                    itemId ??
                      null,
                  );
                }}

                /*
                 * 子要素を持つItemはDirectoryなので、
                 * Timeline表示対象にはしない。
                 *
                 * Folderは展開/縮小のみ行う。
                 */
                isItemSelectionDisabled={(
                  item,
                ) =>
                  Boolean(
                    item.children &&
                      item
                        .children
                        .length >
                        0,
                  )
                }

                /*
                 * 初期状態では
                 * Root階層を展開しておく。
                 *
                 * 必要に応じて削除してもよい。
                 */
                defaultExpandedItems={
                  treeItems.length >
                  0
                    ? [
                        treeItems[0]
                          .id,
                      ]
                    : []
                }

                sx={{
                  width:
                    '100%',

                  height:
                    'fit-content',
                }}

                /*
                 * 自作CustomTreeItemを利用する。
                 */
                slots={{
                  item:
                    CustomTreeItem,
                }}

                /*
                 * Folder階層ごとのIndent幅。
                 */
                itemChildrenIndentation={
                  24
                }
              />
            </Box>

            {/* ===========================
                右側 Timeline
            =========================== */}

            <Box
              sx={{
                flexGrow: 1,

                width: '100%',

                minWidth: 0,
              }}
            >
              {/* Asset Header */}

              <Box
                sx={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'space-between',

                  flexWrap:
                    'wrap',

                  gap: 2,

                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight:
                        700,
                    }}
                  >
                    {selectedAssetName ??
                      'Assetを選択してください'}
                  </Typography>

                  {selectedAssetName && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      Commit History
                    </Typography>
                  )}
                </Box>

                {/* Revision数 */}

                {histories.length >
                  0 && (
                  <Chip
                    label={`${histories.length} revisions`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              {/* Timeline */}

              {selectedGamePath ? (
                <AssetHistoryTimeline
                  histories={
                    histories
                  }
                />
              ) : (
                <Box
                  sx={{
                    minHeight:
                      400,

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    border: 1,

                    borderColor:
                      'divider',

                    borderRadius:
                      2,
                  }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    左側からAssetを選択してください
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
    </Box>
  );
}
```
