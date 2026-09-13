'use client';

import * as React from 'react';

import { animated, useSpring } from '@react-spring/web';

import { styled, alpha } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

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

type ExtendedTreeItemProps = {
  fileType?: FileType;
  id: string;
  label: string;
  children?: ExtendedTreeItemProps[];
};

const ITEMS: ExtendedTreeItemProps[] = [
  {
    id: '1',
    label: 'Content',
    children: [
      {
        id: '1.1',
        label: 'Characters',
        children: [
          {
            id: '1.1.1',
            label: 'BP_Player',
            fileType: 'doc',
          },
          {
            id: '1.1.2',
            label: 'M_Player',
            fileType: 'image',
          },
          {
            id: '1.1.3',
            label: 'T_Player',
            fileType: 'image',
          },
          {
            id: '1.1.4',
            label: 'SK_Player',
            fileType: 'doc',
          },
        ],
      },
      {
        id: '1.2',
        label: 'Maps',
        children: [
          {
            id: '1.2.1',
            label: 'MainMap',
            fileType: 'doc',
          },
        ],
      },
      {
        id: '1.3',
        label: 'Movies',
        children: [
          {
            id: '1.3.1',
            label: 'PlayerDemo',
            fileType: 'video',
          },
        ],
      },
    ],
  },

  {
    id: '2',
    label: 'Bookmarked',
    fileType: 'pinned',
    children: [
      {
        id: '2.1',
        label: 'FavoriteAssets',
        fileType: 'folder',
      },
    ],
  },

  {
    id: '3',
    label: 'History',
    fileType: 'folder',
  },

  {
    id: '4',
    label: 'Trash',
    fileType: 'trash',
  },
];

/* =========================================================
   Asset History
========================================================= */

type AssetHistory = {
  id: number;
  revision: number;
  assetName: string;
  imageUrl: string;
  commitMessage: string;
  updatedAt: string;
};

const ASSET_HISTORIES: Record<string, AssetHistory[]> = {
  '1.1.1': [
    {
      id: 1,
      revision: 12,
      assetName: 'BP_Player',
      imageUrl: '/assets/BP_Player.png',
      commitMessage: 'プレイヤーの移動速度を500から600に変更',
      updatedAt: '2026/09/13 18:30',
    },
    {
      id: 2,
      revision: 11,
      assetName: 'BP_Player',
      imageUrl: '/assets/BP_Player.png',
      commitMessage: 'Skeletal Meshの設定を変更',
      updatedAt: '2026/09/12 14:20',
    },
    {
      id: 3,
      revision: 10,
      assetName: 'BP_Player',
      imageUrl: '/assets/BP_Player.png',
      commitMessage: 'Collision設定を修正',
      updatedAt: '2026/09/11 11:32',
    },
    {
      id: 4,
      revision: 9,
      assetName: 'BP_Player',
      imageUrl: '/assets/BP_Player.png',
      commitMessage: 'BP_Playerを新規追加',
      updatedAt: '2026/09/10 10:03',
    },
  ],

  '1.1.2': [
    {
      id: 5,
      revision: 4,
      assetName: 'M_Player',
      imageUrl: '/assets/M_Player.png',
      commitMessage: 'Roughnessパラメータを変更',
      updatedAt: '2026/09/13 16:42',
    },
    {
      id: 6,
      revision: 3,
      assetName: 'M_Player',
      imageUrl: '/assets/M_Player.png',
      commitMessage: 'BaseColor Textureを変更',
      updatedAt: '2026/09/12 09:20',
    },
  ],

  '1.1.3': [
    {
      id: 7,
      revision: 2,
      assetName: 'T_Player',
      imageUrl: '/assets/T_Player.png',
      commitMessage: 'Texture解像度を変更',
      updatedAt: '2026/09/11 15:20',
    },
    {
      id: 8,
      revision: 1,
      assetName: 'T_Player',
      imageUrl: '/assets/T_Player.png',
      commitMessage: 'Textureを追加',
      updatedAt: '2026/09/10 12:00',
    },
  ],

  '1.1.4': [
    {
      id: 9,
      revision: 5,
      assetName: 'SK_Player',
      imageUrl: '/assets/SK_Player.png',
      commitMessage: 'Skeleton設定を更新',
      updatedAt: '2026/09/13 13:12',
    },
  ],

  '1.2.1': [
    {
      id: 10,
      revision: 7,
      assetName: 'MainMap',
      imageUrl: '/assets/MainMap.png',
      commitMessage: 'ステージのライト設定を修正',
      updatedAt: '2026/09/13 20:15',
    },
  ],

  '1.3.1': [
    {
      id: 11,
      revision: 3,
      assetName: 'PlayerDemo',
      imageUrl: '/assets/PlayerDemo.png',
      commitMessage: 'プレビュー動画を更新',
      updatedAt: '2026/09/13 17:22',
    },
  ],
};

/* =========================================================
   Custom TreeView
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
        zIndex: 1,
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

const TreeItemRoot = styled('li')(({ theme }) => ({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  outline: 0,

  color: theme.palette.grey[400],

  ...theme.applyStyles('light', {
    color: theme.palette.grey[800],
  }),
}));

const TreeItemContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(0.5),
  paddingRight: theme.spacing(1),

  paddingLeft: `calc(
    ${theme.spacing(1)}
    + var(--TreeView-itemChildrenIndentation)
    * var(--TreeView-itemDepth)
  )`,

  width: '100%',
  boxSizing: 'border-box',

  position: 'relative',

  display: 'flex',
  alignItems: 'center',

  gap: theme.spacing(1),

  cursor: 'pointer',

  WebkitTapHighlightColor: 'transparent',

  flexDirection: 'row-reverse',

  borderRadius: theme.spacing(0.7),

  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),

  fontWeight: 500,

  '&[data-expanded]:not([data-focused], [data-selected]) .labelIcon': {
    color: theme.palette.primary.dark,

    ...theme.applyStyles('light', {
      color: theme.palette.primary.main,
    }),

    '&::before': {
      content: '""',

      display: 'block',
      position: 'absolute',

      left: '16px',
      top: '44px',

      height: 'calc(100% - 48px)',
      width: '1.5px',

      backgroundColor: theme.palette.grey[700],

      ...theme.applyStyles('light', {
        backgroundColor: theme.palette.grey[300],
      }),
    },
  },

  '&[data-focused], &[data-selected]': {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,

    ...theme.applyStyles('light', {
      backgroundColor: theme.palette.primary.main,
    }),
  },

  '&:not([data-focused], [data-selected]):hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),

    ...theme.applyStyles('light', {
      color: theme.palette.primary.main,
    }),
  },
}));

const CustomCollapse = styled(Collapse)({
  padding: 0,
});

const AnimatedCollapse = animated(CustomCollapse);

function TransitionComponent(props: TransitionProps) {
  const style = useSpring({
    to: {
      opacity: props.in ? 1 : 0,

      transform: `translate3d(
        0,
        ${props.in ? 0 : 20}px,
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

const TreeItemLabelText = styled(Typography)({
  color: 'inherit',
  fontWeight: 500,
});

interface CustomLabelProps {
  children: React.ReactNode;
  icon?: React.ElementType;
  expandable?: boolean;
}

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
        alignItems: 'center',
      }}
    >
      {Icon && (
        <Box
          component={Icon}
          className="labelIcon"
          sx={{
            color: 'inherit',
            mr: 1,
            fontSize: '1.2rem',
          }}
        />
      )}

      <TreeItemLabelText variant="body2">
        {children}
      </TreeItemLabelText>

      {expandable && <DotIcon />}
    </TreeItemLabel>
  );
}

const getIconFromFileType = (fileType: FileType) => {
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
};

interface CustomTreeItemProps
  extends
    Omit<UseTreeItemParameters, 'rootRef'>,
    Omit<React.HTMLAttributes<HTMLLIElement>, 'onFocus'> {}

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  props: CustomTreeItemProps,
  ref: React.Ref<HTMLLIElement>,
) {
  const {
    id,
    itemId,
    label,
    disabled,
    children,
    ...other
  } = props;

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

  const item =
    useTreeItemModel<ExtendedTreeItemProps>(
      itemId,
    )!;

  let icon;

  if (status.expandable) {
    icon = FolderRounded;
  } else if (item.fileType) {
    icon = getIconFromFileType(
      item.fileType,
    );
  }

  return (
    <TreeItemProvider
      {...getContextProviderProps()}
    >
      <TreeItemRoot
        {...getRootProps(other)}
      >
        <TreeItemContent
          {...getContentProps()}
        >
          <TreeItemIconContainer
            {...getIconContainerProps()}
          >
            <TreeItemIcon
              status={status}
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
});

/* =========================================================
   Thumbnail
========================================================= */

function AssetThumbnail({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [error, setError] =
    React.useState(false);

  if (error) {
    return (
      <Box
        sx={{
          width: 140,
          minWidth: 140,
          height: 140,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          bgcolor: 'action.hover',
        }}
      >
        <ImageIcon
          sx={{
            fontSize: 48,
            color: 'text.secondary',
          }}
        />
      </Box>
    );
  }

  return (
    <CardMedia
      component="img"
      src={src}
      alt={alt}
      onError={() => setError(true)}
      sx={{
        width: 140,
        minWidth: 140,
        height: 140,

        objectFit: 'cover',

        bgcolor: 'action.hover',
      }}
    />
  );
}

/* =========================================================
   Timeline
========================================================= */

function AssetHistoryTimeline({
  histories,
}: {
  histories: AssetHistory[];
}) {
  if (histories.length === 0) {
    return (
      <Box
        sx={{
          minHeight: 300,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          このアセットには履歴がありません
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

        '& .MuiTimelineItem-root:before': {
          flex: 0,
          padding: 0,
        },
      }}
    >
      {histories.map(
        (history, index) => (
          <TimelineItem
            key={history.id}
            sx={{
              minHeight: 180,
            }}
          >
            {/* 日時 */}

            <TimelineOppositeContent
              sx={{
                flex: '0 0 170px',

                pt: 2.2,
                pr: 3,

                textAlign: 'right',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {
                  history.updatedAt.split(
                    ' ',
                  )[0]
                }
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {
                  history.updatedAt.split(
                    ' ',
                  )[1]
                }
              </Typography>
            </TimelineOppositeContent>

            {/* Timeline line */}

            <TimelineSeparator>
              <TimelineDot
                color="primary"
                sx={{
                  mt: 2,
                }}
              >
                <HistoryIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              </TimelineDot>

              {index !==
                histories.length - 1 && (
                <TimelineConnector />
              )}
            </TimelineSeparator>

            {/* Asset */}

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
                  display: 'flex',

                  width: '100%',
                  maxWidth: 720,

                  minHeight: 140,

                  overflow: 'hidden',

                  cursor: 'pointer',

                  transition:
                    'transform 0.15s ease, box-shadow 0.15s ease',

                  '&:hover': {
                    transform:
                      'translateY(-2px)',

                    boxShadow: 4,
                  },
                }}
              >
                <AssetThumbnail
                  src={history.imageUrl}
                  alt={history.assetName}
                />

                <CardContent
                  sx={{
                    flex: 1,

                    display: 'flex',
                    flexDirection: 'column',

                    justifyContent:
                      'center',

                    px: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',

                      gap: 1,

                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {history.assetName}
                    </Typography>

                    <Chip
                      label={`#${history.revision}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      mb: 1,
                    }}
                  >
                    {
                      history.commitMessage
                    }
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Revision{' '}
                    {history.revision}
                  </Typography>
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        ),
      )}
    </Timeline>
  );
}

/* =========================================================
   Page
========================================================= */

export default function Page() {
  const [
    selectedItemId,
    setSelectedItemId,
  ] = React.useState<string | null>(
    '1.1.1',
  );

  const histories =
    selectedItemId !== null
      ? ASSET_HISTORIES[
          selectedItemId
        ] ?? []
      : [];

  const selectedAssetName =
    histories.length > 0
      ? histories[0].assetName
      : null;

  return (
    <Box
      sx={{
        minHeight: '100vh',

        width: '100%',

        p: {
          xs: 2,
          md: 4,
        },

        bgcolor: 'background.default',
      }}
    >
      {/* Header */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700 }}
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

      {/* Main */}

      <Box
        sx={{
          display: 'flex',

          flexDirection: {
            xs: 'column',
            md: 'row',
          },

          alignItems: 'flex-start',

          gap: 4,
        }}
      >
        {/* TreeView */}

        <Box
          sx={{
            width: {
              xs: '100%',
              md: 320,
            },

            flexShrink: 0,

            border: 1,
            borderColor: 'divider',

            borderRadius: 2,

            bgcolor: 'background.paper',

            p: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 2,
              px: 1,
            }}
          >
            Asset Tree
          </Typography>

          <RichTreeView
            items={ITEMS}

            defaultExpandedItems={[
              '1',
              '1.1',
            ]}

            selectedItems={
              selectedItemId
            }

            onSelectedItemsChange={(
              _event,
              itemId,
            ) => {
              if (
                Array.isArray(itemId)
              ) {
                setSelectedItemId(
                  itemId[0] ?? null,
                );

                return;
              }

              setSelectedItemId(
                itemId ?? null,
              );
            }}

            /*
             * 子要素を持っているものは
             * Directoryなので選択不可
             */
            isItemSelectionDisabled={(
              item,
            ) =>
              Boolean(
                item.children &&
                  item.children.length >
                    0,
              )
            }

            sx={{
              width: '100%',
              height: 'fit-content',

              overflowY: 'auto',
            }}

            slots={{
              item: CustomTreeItem,
            }}

            itemChildrenIndentation={
              24
            }
          />
        </Box>

        {/* History */}

        <Box
          sx={{
            flexGrow: 1,

            width: '100%',

            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',

              alignItems: 'center',

              justifyContent:
                'space-between',

              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700 }}
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

            {histories.length >
              0 && (
              <Chip
                label={`${histories.length} revisions`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {selectedItemId ? (
            <AssetHistoryTimeline
              histories={histories}
            />
          ) : (
            <Box
              sx={{
                minHeight: 400,

                display: 'flex',

                alignItems: 'center',
                justifyContent:
                  'center',

                border: 1,
                borderColor:
                  'divider',

                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                左側からAssetを選択してください
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

