"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";

// MCUインフィニティ・サーガ（公開順）のフェーズ
// 公開年は米国での劇場公開年を採用しています。
type Phase = 1 | 2 | 3;

type Movie = {
  id: string;
  title: string;
  year: number;
  phase: Phase;
  description: string;
  // public/images/marvel/ に置いた画像を使用する
  thumbnail: string;
  // 感想と評価は未登録。後から各作品に書き足せます。
  review?: string;
  rating: number;
};

// データの並びがそのままカードの「公開順」になります。
const movies: Movie[] = [
  {
    id: "iron-man", title: "アイアンマン", year: 2008, phase: 1,
    description: "天才発明家トニー・スタークが、自ら開発したアーマーでヒーローとして歩み始める物語。",
    thumbnail: "/images/marvel/iron-man.jpg",
    rating: 4.3,
    review: `すべての原点。
    
    ロボットもの作品もあまり見ないし、金持ちも好きではないし、おっさんだしで正直期待していなかった。むしろ見るのを避けていたまである。
    しかし、アベンジャーズの予習のためになんとなく見るかあと重い腰を上げて付けてみたところ,,,
    
    開始10分くらいで一気に引き込まれた。トニーのキャラクターがとにかく魅力的で、彼の成長や葛藤がリアルに描かれている。アクションシーンも迫力満点で、特にアイアンマンのスーツのデザインや飛行シーンは圧巻だった。
    そもそもなぜアイアンスーツを作ることになったのか、彼が何と戦うのかというルーツが丁寧に描かれており感情移入もすごいしやすい。
    
    結局アイアンマンが一番いいんだよなと、そう思う人もすごい多いと思う。
  `
  },
  {
    id: "incredible-hulk", title: "インクレディブル・ハルク", year: 2008, phase: 1,
    description: "怒りによって巨大なハルクに変身するブルース・バナーが、自らの力と向き合う。",
    thumbnail: "/images/marvel/incredible-hulk.jpg",
    rating: 3.0
  },
  {
    id: "iron-man-2", title: "アイアンマン2", year: 2010, phase: 1,
    description: "アイアンマンの正体を公表したトニーに、新たな脅威と試練が迫る。",
    thumbnail: "/images/marvel/iron-man-2.jpg",
    rating: 3.5
  },
  {
    id: "thor", title: "マイティ・ソー", year: 2011, phase: 1,
    description: "神の国アスガルドの王子ソーが、地球で本当の強さと責任を学んでいく。",
    thumbnail: "/images/marvel/thor.jpg",
    rating: 4.0
  },
  {
    id: "captain-america-1", title: "キャプテン・アメリカ／ザ・ファースト・アベンジャー", year: 2011, phase: 1,
    description: "第二次世界大戦下、スティーブ・ロジャースが超人兵士となって戦いに挑む。",
    thumbnail: "/images/marvel/captain-america-1.jpg",
    rating: 4.2
  },
  {
    id: "avengers", title: "アベンジャーズ", year: 2012, phase: 1,
    description: "地球を襲う危機を前に、個性豊かなヒーローたちが初めてチームを結成する。",
    thumbnail: "/images/marvel/avengers.jpg",
    rating: 4.1
  },
  {
    id: "iron-man-3", title: "アイアンマン3", year: 2013, phase: 2,
    description: "大きな戦いの傷を抱えたトニーが、アーマーと自分自身の存在意義を問う。",
    thumbnail: "/images/marvel/iron-man-3.jpg",
    rating: 3.8
  },
  {
    id: "thor-dark-world", title: "マイティ・ソー／ダーク・ワールド", year: 2013, phase: 2,
    description: "世界を闇で包もうとする敵に、ソーが再び立ち向かう。",
    thumbnail: "/images/marvel/thor-dark-world.jpg",
    rating: 3.0
  },
  {
    id: "winter-soldier", title: "キャプテン・アメリカ／ウィンター・ソルジャー", year: 2014, phase: 2,
    description: "現代に生きるキャプテン・アメリカが、巨大組織に潜む陰謀へ迫る。",
    thumbnail: "/images/marvel/winter-soldier.jpg",
    rating: 4.0
  },
  {
    id: "guardians-1", title: "ガーディアンズ・オブ・ギャラクシー", year: 2014, phase: 2,
    description: "宇宙のはみ出し者たちが、銀河の命運をかけてチームを結成する。",
    thumbnail: "/images/marvel/guardians-1.jpg",
    rating: 4.6
  },
  {
    id: "age-of-ultron", title: "アベンジャーズ／エイジ・オブ・ウルトロン", year: 2015, phase: 2,
    description: "人工知能ウルトロンの暴走により、アベンジャーズは新たな危機に直面する。",
    thumbnail: "/images/marvel/age-of-ultron.jpg",
    rating: 3.5
  },

  {
    id: "ant-man", title: "アントマン", year: 2015, phase: 2,
    description: "体の大きさを自由に変えるスーツを手にしたスコット・ラングのヒーロー物語。",
    thumbnail: "/images/marvel/ant-man.jpg",
    rating: 3.9
  },
  {
    id: "civil-war", title: "シビル・ウォー／キャプテン・アメリカ", year: 2016, phase: 3,
    description: "ヒーローの活動をめぐる対立が、アベンジャーズを二分する。",
    thumbnail: "/images/marvel/civil-war.jpg",
    rating: 3.7
  },
  {
    id: "doctor-strange", title: "ドクター・ストレンジ", year: 2016, phase: 3,
    description: "天才外科医が魔術の世界を知り、現実の常識を超えた戦いに身を投じる。",
    thumbnail: "/images/marvel/doctor-strange.jpg",
    rating: 3.5
  },
  {
    id: "guardians-2", title: "ガーディアンズ・オブ・ギャラクシー：リミックス", year: 2017, phase: 3,
    description: "ガーディアンズの仲間たちが、ピーター・クイルの出生の秘密に迫る。",
    thumbnail: "/images/marvel/guardians-2.jpg",
    rating: 4.5
  },
  {
    id: "homecoming", title: "スパイダーマン：ホームカミング", year: 2017, phase: 3,
    description: "学生生活とヒーロー活動を両立しながら、ピーターが成長していく。",
    thumbnail: "/images/marvel/homecoming.jpg",
    rating: 4.7
  },
  {
    id: "ragnarok", title: "マイティ・ソー バトルロイヤル", year: 2017, phase: 3,
    description: "故郷アスガルドの危機を前に、ソーが予想外の仲間と冒険する。",
    thumbnail: "/images/marvel/ragnarok.jpg",
    rating: 4.7
  },
  {
    id: "black-panther", title: "ブラックパンサー", year: 2018, phase: 3,
    description: "ワカンダの若き国王ティ・チャラが、王としての責務と向き合う。",
    thumbnail: "/images/marvel/black-panther.jpg",
    rating: 3.9
  },
  {
    id: "infinity-war", title: "アベンジャーズ／インフィニティ・ウォー", year: 2018, phase: 3,
    description: "インフィニティ・ストーンを狙うサノスに、ヒーローたちが総力で挑む。",
    thumbnail: "/images/marvel/infinity-war.jpg",
    rating: 4.2
  },
  {
    id: "ant-man-wasp", title: "アントマン＆ワスプ", year: 2018, phase: 3,
    description: "アントマンとワスプが協力し、量子世界をめぐるミッションに挑む。",
    thumbnail: "/images/marvel/ant-man-wasp.jpg",
    rating: 3.9
  },
  {
    id: "captain-marvel", title: "キャプテン・マーベル", year: 2019, phase: 3,
    description: "1990年代の地球を舞台に、記憶を失った戦士が自分の過去を探る。",
    thumbnail: "/images/marvel/captain-marvel.jpg",
    rating: 3.4
  },
  {
    id: "endgame", title: "アベンジャーズ／エンドゲーム", year: 2019, phase: 3,
    description: "失われたものを取り戻すため、生き残ったヒーローたちが最後の作戦に挑む。",
    thumbnail: "/images/marvel/endgame.jpg",
    rating: 5.0
  },
  {
    id: "far-from-home", title: "スパイダーマン：ファー・フロム・ホーム", year: 2019, phase: 3,
    description: "ヨーロッパ旅行に出たピーターが、新たな脅威とヒーローとしての責任に向き合う。",
    thumbnail: "/images/marvel/far-from-home.jpg",
    rating: 4.6
  },
];

const phases: Phase[] = [1, 2, 3];

// フェーズ別の公開年を自動抽出する。後から作品を増やしても自動で反映。
const yearsByPhase: Record<Phase, number[]> = {
  1: [...new Set(movies.filter((m) => m.phase === 1).map((m) => m.year))],
  2: [...new Set(movies.filter((m) => m.phase === 2).map((m) => m.year))],
  3: [...new Set(movies.filter((m) => m.phase === 3).map((m) => m.year))],
};

// 初回表示は全フェーズと公開年を展開する。
const initialExpandedItems = phases.flatMap((phase) => [
  `phase-${phase}`,
  ...yearsByPhase[phase].map((year) => `phase-${phase}-year-${year}`),
]);



// 画像ファイルがないときに表示する代替サムネイル。
function MovieThumbnail({ movie }: { movie: Movie }) {
  const [imageFailed, setImageFailed] = useState(false);
  const phaseColor: Record<Phase, string> = {
    1: "#82262d",
    2: "#244a6d",
    3: "#5b397f",
  };

  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: "2 / 3",
        overflow: "hidden",
        bgcolor: phaseColor[movie.phase],
        backgroundImage: `linear-gradient(155deg, ${phaseColor[movie.phase]}, #0a101c 85%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      {/* サムネイルがない場合もカードが崩れない */}
      <Box sx={{ textAlign: "center", color: "#fff" }}>
        <MovieFilterIcon sx={{ fontSize: 42, opacity: 0.55, mb: 2 }} />
        <Typography variant="overline" sx={{ display: "block", opacity: 0.8 }}>
          MARVEL MOVIE REVIEW
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.4 }}>
          {movie.title}
        </Typography>
      </Box>
      {!imageFailed && (
        <Box
          component="img"
          src={movie.thumbnail}
          alt={`${movie.title} のサムネイル`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <Chip
        label={`PHASE ${movie.phase}`}
        size="small"
        sx={{
          position: "absolute", top: 12, left: 12,
          bgcolor: "rgba(12,15,24,0.83)", color: "white", fontWeight: 700,
          fontSize: "0.67rem", letterSpacing: 0.5,
        }}
      />
    </Box>
  );
}


export default function Page() {
  // null なら「全作品」、ID が入っていればその1作品だけ表示。
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId);

  const filteredMovies = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase();
    return movies.filter((movie) => {
      const matchesSelection = selectedMovieId === null || movie.id === selectedMovieId;
      const matchesSearch =
        keyword.length === 0 ||
        `${movie.title} ${movie.description} ${movie.year} フェーズ${movie.phase}`
          .toLocaleLowerCase()
          .includes(keyword);
      return matchesSelection && matchesSearch;
    });
  }, [selectedMovieId, searchText]);

  const selectMovie = (id: string) => {
    setSelectedMovieId(id);
    setSearchText("");
  };

  const showAllMovies = () => {
    setSelectedMovieId(null);
    setSearchText("");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f9", color: "#18202b", px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        {/* タイトル領域 */}
        <Box sx={{ mb: 4, borderBottom: "1px solid #e2e5eb", pb: 3 }}>
          <Typography variant="overline" sx={{ color: "#c62828", fontWeight: 900, letterSpacing: 3 }}>
            MARVEL STUDIOS / THE INFINITY SAGA
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: "2rem", md: "2.8rem" }, mt: 0.5 }}>
            Movie Review Archive
          </Typography>
          <Typography variant="body2" sx={{ color: "#687384", mt: 1 }}>
            インフィニティ・サーガ全23作品のレビューを、公開順に振り返る。
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: 2, md: 4 }, alignItems: "flex-start", flexDirection: { xs: "column", md: "row" } }}>
          {/* 左側：ヒストリー / Tree View */}
          <Box
            component="aside"
            sx={{
              width: { xs: "100%", md: 286 }, flexShrink: 0,
              position: { md: "sticky" }, top: { md: 24 },
              bgcolor: "#fff", border: "1px solid #e2e5eb", borderRadius: 2,
              p: 2, maxHeight: { md: "calc(100vh - 48px)" }, overflowY: "auto",
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 800, color: "#687384" }}>
                HISTORY
              </Typography>
              <Typography variant="caption" color="text.secondary">2008 – 2019</Typography>
            </Stack>
            <Button
              fullWidth
              startIcon={<MovieFilterIcon />}
              onClick={showAllMovies}
              variant={selectedMovieId === null ? "contained" : "text"}
              sx={{
                justifyContent: "flex-start", textTransform: "none", fontWeight: 700,
                mb: 1, bgcolor: selectedMovieId === null ? "#c62828" : "transparent",
                color: selectedMovieId === null ? "#fff" : "#404b5a",
                "&:hover": { bgcolor: selectedMovieId === null ? "#a91e1e" : "#f4f5f8" },
              }}
            >
              全作品を表示（{movies.length}）
            </Button>

            <SimpleTreeView
              aria-label="マーベル作品の公開履歴"
              defaultExpandedItems={initialExpandedItems}
              // 親の「フェーズ」「年」は展開だけ、作品を選ぶとカードを絞り込む。
              selectedItems={selectedMovieId ? `movie-${selectedMovieId}` : null}
              onSelectedItemsChange={(
                 _event: SyntheticEvent<Element, Event> | null,
                 itemIds: string | null
              ) => {
                if (itemIds?.startsWith("movie-")) {
                  selectMovie(itemIds.slice("movie-".length));
                }
              }}
              sx={{
                "& .MuiTreeItem-content": { borderRadius: 1, py: 0.45 },
                "& .MuiTreeItem-content.Mui-selected": { bgcolor: "#fff0f0", color: "#b71c1c" },
                "& .MuiTreeItem-content.Mui-selected:hover": { bgcolor: "#ffe4e4" },
                "& .MuiTreeItem-label": { fontSize: 12.5 },
              }}
            >
              {phases.map((phase) => (
                <TreeItem
                  key={phase}
                  itemId={`phase-${phase}`}
                  label={`PHASE ${phase}  (${movies.filter((m) => m.phase === phase).length})`}
                  // 親項目は選択させず、開閉操作だけ許可する。
                  disableSelection
                >
                  {yearsByPhase[phase].map((year) => (
                    <TreeItem
                      key={`${phase}-${year}`}
                      itemId={`phase-${phase}-year-${year}`}
                      label={`${year}年`}
                      disableSelection
                    >
                      {movies
                        .filter((movie) => movie.phase === phase && movie.year === year)
                        .map((movie) => (
                          <TreeItem
                            key={movie.id}
                            itemId={`movie-${movie.id}`}
                            label={movie.title}
                          />
                        ))}
                    </TreeItem>
                  ))}
                </TreeItem>
              ))}
            </SimpleTreeView>
          </Box>

          {/* 右側：検索とレビューカード */}
          <Box component="main">
          <Box
              sx={{
                display: "grid",
                // 1作品選択時は「作品カード + レビューカード」の2カラム。
                // 幅が狭い画面では縦並びに切り替える。
                gridTemplateColumns: selectedMovieId
                  ? { xs: "1fr", md: "minmax(240px, 340px) minmax(0, 1fr)" }
                  : { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                gap: 2.5,
              }}
            >
              {filteredMovies.map((movie) => (
                <Card
                  key={movie.id}
                  variant="outlined"
                  sx={{
                    overflow: "hidden", borderRadius: 2.5, borderColor: "#e0e4eb",
                    cursor: "pointer", boxShadow: "none", transition: "transform .18s, box-shadow .18s",
                    "&:hover": { transform: "translateY(-3px)", boxShadow: "0 10px 28px rgba(24,32,43,.11)" },
                  }}
                >
                  <CardActionArea onClick={() => selectMovie(movie.id)}>
                  <MovieThumbnail movie={movie} />
                  <CardContent sx={{ p: 2.3, "&:last-child": { pb: 2.3 } }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="caption" sx={{ color: "#bf2525", fontWeight: 800 }}>
                        PHASE {movie.phase}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6d7787" }}>
                        {movie.year}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontSize: "1.04rem", fontWeight: 800, lineHeight: 1.4, mb: 1, minHeight: 45 }}>
                      {movie.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#647184", lineHeight: 1.7, minHeight: 72 }}>
                      {movie.description}
                    </Typography>
                    <Box sx={{ borderTop: "1px solid #edf0f3", mt: 2, pt: 1.5 }}>
                      {typeof movie.rating === "number" ? (
                        <Stack direction="row" spacing={0.4} sx={{ alignItems: "center" }}>
                          <StarRoundedIcon sx={{ fontSize: 18, color: "#e1a200" }} />
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{movie.rating.toFixed(1)} / 5</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#8993a1" }}>評価：{movie.rating || "未登録"}</Typography>
                      )}
                      {/* 全作品一覧では従来通りレビューをカード内に表示。
                          1作品選択時は右の専用カードに表示するため重複させない。 */}
                      {/* {!selectedMovieId && movie.review && (
                        <Typography variant="body2" sx={{ mt: 1, color: "#4d5969" }}>
                          {movie.review}
                        </Typography>
                      )} */}
                    </Box>
                  </CardContent>
                  </CardActionArea>
                </Card>
              ))}

              {/* 1作品だけ選択された場合、映画カードの右側にレビュー本文を表示 */}
              {selectedMovie && filteredMovies.length === 1 && (
                <Card
                  variant="outlined"
                  sx={{
                    minWidth: 0,
                    borderRadius: 2.5,
                    borderColor: "#e0e4eb",
                    boxShadow: "none",
                    bgcolor: "#fff",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 }, "&:last-child": { pb: { xs: 2.5, md: 3 } } }}>
                    <Typography variant="overline" sx={{ color: "#bf2525", fontWeight: 800, letterSpacing: 1.5 }}>
                      MOVIE REVIEW
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>
                      {selectedMovie.title} のレビュー
                    </Typography>
                    <Box sx={{ borderTop: "1px solid #edf0f3", pt: 2 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: "pre-wrap", // movie.review に書いた改行をそのまま表示
                          overflowWrap: "anywhere",
                          color: selectedMovie.review?.trim() ? "#344054" : "#8993a1",
                          lineHeight: 1.9,
                        }}
                      >
                        {selectedMovie.review?.trim() || "レビューはまだ登録されていません。"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {filteredMovies.length === 0 && (
              <Box sx={{ py: 10, textAlign: "center", color: "#687384" }}>
                <Typography variant="h6">該当する作品が見つかりませんでした。</Typography>
                <Button onClick={showAllMovies} sx={{ mt: 2 }}>全作品に戻る</Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
