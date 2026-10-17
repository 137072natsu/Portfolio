"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  InputAdornment,
  Rating,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MovieFilterRoundedIcon from "@mui/icons-material/MovieFilterRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";


type Phase = 1 | 2 | 3;
type PhaseFilter = Phase | "all";

type Movie = {
  id: string;
  title: string;
  year: number;
  phase: Phase;
  description: string;
  thumbnail: string;  // public/images/marvel/ 以下の画像
  review?: string;    // ここに感想を書き込む
  rating: number;
};

// データの並びがそのままカードの「公開順」になります。
const movies: Movie[] = [
  {
    id: "iron-man", title: "アイアンマン", year: 2008, phase: 1,
    description: "天才発明家トニー・スタークが、自ら開発したアーマーでヒーローとして歩み始める物語。",
    thumbnail: "/images/marvel/iron-man.jpg",
    rating: 4.3,
    review: `原点にして...

    さすがに面白い。自分はこれを見ずにいきなりアベンジャーズから入ったので、当時はなんか金持ちのロボットスーツ持ったおっさんおるなぁって感じ
    
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
const phaseColors: Record<Phase, string> = {
  1: "#f05a5b",
  2: "#e7b36c",
  3: "#b7a0f2",
};
const background = "#080a10";
const panel = "#10141d";
const muted = "#939baa";


// 元データの公開順をそのまま採用
const yearsByPhase: Record<Phase, number[]> = {
  1: [...new Set(movies.filter((m) => m.phase === 1).map((m) => m.year))],
  2: [...new Set(movies.filter((m) => m.phase === 2).map((m) => m.year))],
  3: [...new Set(movies.filter((m) => m.phase === 3).map((m) => m.year))],
};
const initialExpandedItems = phases.flatMap((phase) => [
  `phase-${phase}`,
  ...yearsByPhase[phase].map((year) => `phase-${phase}-year-${year}`),
]);
const averageRating = movies.reduce((sum, movie) => sum + movie.rating, 0) / movies.length;

const readableReview = (review?: string) =>
  review?.split("\n").map((line) => line.trim()).join("\n").trim() || "";

// 画像が存在しない場合はグラデーションの代替ポスターを表示
function MovieThumbnail({ movie }: { movie: Movie }) {
  const [imageFailed, setImageFailed] = useState(false);
  const number = String(movies.findIndex((m) => m.id === movie.id) + 1).padStart(2, "0");
  const accent = phaseColors[movie.phase];


  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: "2 / 3",
        overflow: "hidden",
        isolation: "isolate",
        bgcolor: "#1a202e",
        backgroundImage: `radial-gradient(circle at 50% 25%, ${accent}60, transparent 55%), linear-gradient(150deg, #22283b, #080b13)`,
      }}
    >
      {/* ポスターがまだない作品の代替画像 */}
      <Box
        sx={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center", p: 3,
          color: "#f3f5f9",
        }}
      >
        <MovieFilterRoundedIcon sx={{ fontSize: 46, color: accent, mb: 2 }} />
        <Typography sx={{ fontSize: 10, letterSpacing: 3, fontWeight: 800, color: "#b4becd", mb: 1.5 }}>
          THE INFINITY SAGA
        </Typography>
        <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, lineHeight: 1.45 }}>
          {movie.title}
        </Typography>
      </Box>
      {!imageFailed && (
        <Box
          className="poster-art"
          component="img"
          src={movie.thumbnail}
          alt={`${movie.title}のポスター`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          sx={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", transition: "transform 450ms cubic-bezier(.2,.7,.2,1)",
          }}
        />
      )}
      {/* ポスター上の共通オーバーレイ */}
      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,6,12,.53), transparent 35%, transparent 58%, rgba(5,8,14,.72))", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", top: 13, left: 13, right: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ px: 1.15, py: 0.5, bgcolor: "rgba(5,8,14,.77)", border: "1px solid rgba(255,255,255,.20)", borderRadius: 0.8, backdropFilter: "blur(6px)" }}>
          <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.1, color: "#fff" }}>PHASE {movie.phase}</Typography>
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 2px 8px #000" }}>
          {number}
        </Typography>
      </Box>
      <Box sx={{ position: "absolute", bottom: 14, left: 15, right: 15, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Typography sx={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 900, color: "rgba(255,255,255,.85)" }}>MCU / ARCHIVE</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{movie.year}</Typography>
      </Box>
    </Box>
  );
}

function MovieCard({ movie, onSelect }: { movie: Movie; onSelect: () => void }) {
  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: panel, color: "#f8f9fb", borderColor: "#282e3c", borderRadius: 2,
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 12px 28px rgba(0,0,0,.12)",
        transition: "transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
        "&:hover": { transform: "translateY(-6px)", borderColor: "#d64a4d", boxShadow: "0 20px 40px rgba(0,0,0,.33)" },
        "&:hover .poster-art": { transform: "scale(1.055)" },
      }}
    >
      <CardActionArea onClick={onSelect} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" }}>
        <MovieThumbnail movie={movie} />
        <CardContent sx={{ p: { xs: 2.2, md: 2.5 }, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
            <Box sx={{ width: 17, height: 2, bgcolor: phaseColors[movie.phase] }} />
            <Typography sx={{ color: "#a8b0be", letterSpacing: 1.4, fontSize: 10.5, fontWeight: 800 }}>
              PHASE {movie.phase} — {movie.year}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 850, fontSize: "1.03rem", lineHeight: 1.55, minHeight: 50, mb: 1 }}>
            {movie.title}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: muted, lineHeight: 1.75, mb: 2.4, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
            {movie.description}
          </Typography>
          <Box sx={{ mt: "auto", borderTop: "1px solid #282e3c", pt: 1.7, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
              <StarRoundedIcon sx={{ color: "#ffcc7a", fontSize: 20 }} />
              <Typography sx={{ fontWeight: 900, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
                {movie.rating.toFixed(1)}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#737c8d" }}>/ 5.0</Typography>
            </Box>
            <Box sx={{ color: "#f16b6d", display: "flex", alignItems: "center", gap: 0.4 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 850, letterSpacing: 1 }}>VIEW</Typography>
              <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function ReviewPanel({ movie }: { movie: Movie }) {
  const review = readableReview(movie.review);
  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        minWidth: 0, bgcolor: panel, color: "#fff", borderColor: "#2a303e",
        borderRadius: 2, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,.16)",
        backgroundImage: "radial-gradient(circle at 100% 0%, rgba(213,53,64,.11), transparent 45%)",
      }}
    >
      <Box sx={{ height: 4, background: "linear-gradient(90deg, #ee4e58, #8f2939 58%, transparent)" }} />
      <Box sx={{ p: { xs: 3, sm: 4, lg: 5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3.5 }}>
          <Typography sx={{ color: "#ff6a72", fontSize: 11, letterSpacing: 3, fontWeight: 900 }}>
            PERSONAL FILM JOURNAL
          </Typography>
          <Typography sx={{ color: "#768091", fontSize: 11, fontWeight: 850, letterSpacing: 1.2 }}>
            REVIEW / {String(movies.findIndex((m) => m.id === movie.id) + 1).padStart(2, "0")}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: { xs: 24, md: 30, lg: 36 }, lineHeight: 1.35, fontWeight: 900, letterSpacing: -0.6, mb: 1.2 }}>
          {movie.title}
        </Typography>
        <Typography sx={{ color: muted, fontSize: 12, letterSpacing: 1.25, mb: 3 }}>
          {movie.year} / PHASE {movie.phase} / THE INFINITY SAGA
        </Typography>
        <Box sx={{ borderBlock: "1px solid #303543", py: 2.3, mb: 3.5, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.8 }}>
          <Typography sx={{ color: "#a5afc0", fontSize: 11, letterSpacing: 1.6, fontWeight: 850 }}>MY RATING</Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: "#ffcf86", fontVariantNumeric: "tabular-nums" }}>
              {movie.rating.toFixed(1)}
            </Typography>
            <Typography sx={{ fontSize: 13, color: muted }}>/ 5.0</Typography>
          </Box>
          <Rating
            value={movie.rating}
            precision={0.1}
            max={5}
            readOnly
            size="small"
            sx={{ color: "#ffcf86", "& .MuiRating-iconEmpty": { color: "#454b58" } }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2.2 }}>
          <Box sx={{ width: 4, height: 21, bgcolor: "#f45d65", borderRadius: 2 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: 2.1, color: "#e3e8f1" }}>REVIEW NOTES</Typography>
        </Box>
        {review ? (
          <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: { xs: 14, md: 15 }, color: "#d4d8e2", lineHeight: 2.2, letterSpacing: 0.15 }}>
            {review}
          </Typography>
        ) : (
          <Box sx={{ border: "1px dashed #3c4453", p: 3, borderRadius: 1.5, bgcolor: "rgba(255,255,255,.018)" }}>
            <Typography sx={{ fontSize: 14, color: "#aab3c2", lineHeight: 1.9 }}>
              まだレビューは登録されていません。 <Box component="code" sx={{ color: "#ff8388" }}>movie.review</Box> に感想を書き込むと、ここに表示されます。
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}





export default function Page() {
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId) ?? null;
  const filteredMovies = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase();
    return movies.filter((movie) => {
      const matchesSelection = selectedMovieId === null || movie.id === selectedMovieId;
      const matchesPhase = selectedMovieId !== null || phaseFilter === "all" || movie.phase === phaseFilter;
      const searchable = `${movie.title} ${movie.description} ${movie.year} phase ${movie.phase} ${movie.review || ""}`.toLocaleLowerCase();
      return matchesSelection && matchesPhase && (keyword === "" || searchable.includes(keyword));
    });
  }, [selectedMovieId, searchText, phaseFilter]);

  const selectMovie = (id: string) => {
    setSelectedMovieId(id);
    setSearchText("");
    setPhaseFilter("all");
  };
  const showAllMovies = () => {
    setSelectedMovieId(null);
    setSearchText("");
    setPhaseFilter("all");
  };
  const selectPhase = (phase: PhaseFilter) => {
    setSelectedMovieId(null);
    setPhaseFilter(phase);
    setSearchText("");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: background, color: "#f8f9fc", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", pb: 10, overflowX: "hidden" }}>
      {/* ページの上部に細いフィルム風のライン */}
      <Box sx={{ height: 4, background: "linear-gradient(90deg, #801d2d, #f0525f 35%, #f7ae74 65%, #681c2c)" }} />
      <Box sx={{ mx: "auto", maxWidth: 1540, px: { xs: 2, sm: 3, lg: 5 } }}>
        {/* ナビゲーション */}
        <Box sx={{ height: 82, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #232735", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
            <Box sx={{ width: 38, height: 38, border: "1px solid #b7444d", borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "#27151e", color: "#f06a70" }}>
              <MovieFilterRoundedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 950, letterSpacing: 2.5, lineHeight: 1.3 }}>THE MCU ARCHIVE</Typography>
              <Typography sx={{ color: "#7c8697", letterSpacing: 2, fontSize: 9.5, mt: 0.45 }}>PERSONAL MOVIE JOURNAL</Typography>
            </Box>
          </Box>
          <Typography sx={{ color: "#a6afbc", border: "1px solid #343949", borderRadius: 15, px: 1.7, py: 0.9, fontSize: 10.5, fontWeight: 850, letterSpacing: 1.5, display: { xs: "none", sm: "block" } }}>
            VOL. 01 — 03 <Box component="span" sx={{ color: "#f05c66", ml: 1 }}>●</Box> 2008—2019
          </Typography>
        </Box>

        {/* シネマティックなメインタイトル */}
        <Box sx={{ position: "relative", isolation: "isolate", minHeight: { xs: 295, md: 330 }, py: { xs: 5, md: 6 }, mb: 4, borderBottom: "1px solid #222937", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, zIndex: -1, background: "radial-gradient(circle at 90% 48%, rgba(214,47,64,.25), transparent 32%),radial-gradient(circle at 65% -25%,rgba(107,65,112,.2), transparent 42%),linear-gradient(115deg,#080a10,#11101b 65%,#0b0a13)" }} />
          <Box sx={{ position: "absolute", right: { xs: -120, md: -75 }, top: { xs: 15, md: -100 }, height: { xs: 310, md: 500 }, width: { xs: 310, md: 500 }, border: "1px solid rgba(240,80,92,.17)", borderRadius: "50%", boxShadow: "0 0 0 65px rgba(240,80,92,.025), 0 0 0 130px rgba(240,80,92,.015)", pointerEvents: "none" }} />
          <Typography sx={{ color: "#fa777f", letterSpacing: 3.5, fontSize: 10.5, fontWeight: 900, mb: 2.1 }}>MARVEL STUDIOS / THE INFINITY SAGA</Typography>
          <Typography component="h1" sx={{ fontSize: { xs: 41, sm: 59, md: 76 }, fontWeight: 950, letterSpacing: { xs: -1.3, md: -3.2 }, lineHeight: 1.06, maxWidth: 830, textShadow: "0 9px 32px rgba(0,0,0,.3)" }}>
            Every hero.<br />
            <Box component="span" sx={{ color: "#f05f67" }}>Every story.</Box>
          </Typography>
          <Typography sx={{ maxWidth: 590, mt: 2.5, color: "#aeb7c6", fontSize: { xs: 12.5, sm: 14 }, lineHeight: 1.9 }}>
            ひとつのユニバース、23の物語。インフィニティ・サーガを公開順に辿りながら、映画の記憶と感想を記録するプライベート・アーカイブ。
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", mt: 3.5, gap: { xs: 2.5, sm: 4 } }}>
            {[
              { number: String(movies.length).padStart(2, "0"), label: "FILMS" },
              { number: "03", label: "PHASES" },
              { number: averageRating.toFixed(1), label: "AVG. RATING" },
            ].map((item) => (
              <Box key={item.label} sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{item.number}</Typography>
                <Typography sx={{ color: "#818b9b", fontSize: 10, fontWeight: 900, letterSpacing: 1.7 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ヒストリー + 映画一覧 */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 3, lg: 4 }, flexDirection: { xs: "column", md: "row" } }}>
          <Box component="aside" sx={{ width: { xs: "100%", md: 255, lg: 274 }, flexShrink: 0, position: { md: "sticky" }, top: { md: 24 } }}>
            <Box sx={{ border: "1px solid #2a303d", bgcolor: panel, borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ p: 2.4, pb: 1.8, borderBottom: "1px solid #282e39", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: "#ef6670" }} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 950, letterSpacing: 2 }}>TIMELINE</Typography>
                </Box>
                <Typography sx={{ fontSize: 10, color: "#7d8698", fontWeight: 800 }}>08 — 19</Typography>
              </Box>
              <Box sx={{ p: 1.5, maxHeight: { md: "calc(100vh - 115px)" }, overflowY: "auto", "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#333b49", borderRadius: 5 } }}>
                <Button
                  fullWidth
                  onClick={showAllMovies}
                  startIcon={<GridViewRoundedIcon sx={{ fontSize: 17 }} />}
                  sx={{
                    textTransform: "none", justifyContent: "flex-start", fontSize: 12.5,
                    fontWeight: 850, borderRadius: 1.1, py: 1.1, px: 1.45, mb: 1.5,
                    bgcolor: selectedMovieId === null && phaseFilter === "all" ? "#b62f3d" : "transparent",
                    color: selectedMovieId === null && phaseFilter === "all" ? "#fff" : "#b9c2d0",
                    "&:hover": { bgcolor: selectedMovieId === null && phaseFilter === "all" ? "#c84350" : "#222938" },
                  }}
                >
                  ALL MOVIES <Box component="span" sx={{ ml: "auto", fontSize: 11, opacity: 0.7 }}>{movies.length}</Box>
                </Button>
                <SimpleTreeView
                  aria-label="MCU作品公開ヒストリー"
                  defaultExpandedItems={initialExpandedItems}
                  selectedItems={selectedMovieId ? `movie-${selectedMovieId}` : null}
                  onSelectedItemsChange={(
                    _event: SyntheticEvent<Element, Event> | null,
                    itemId: string | null
                  ) => {
                    if (itemId?.startsWith("movie-")) selectMovie(itemId.slice(6));
                  }}
                  itemChildrenIndentation={13}
                  sx={{
                    "& .MuiTreeItem-content": { borderRadius: 1, py: 0.35, minHeight: 31, color: "#a8b2c1", transition: "background .15s" },
                    "& .MuiTreeItem-content:hover": { bgcolor: "#212835" },
                    "& .MuiTreeItem-content.Mui-selected": { bgcolor: "rgba(205,58,67,.17)", color: "#ff9299" },
                    "& .MuiTreeItem-content.Mui-selected:hover": { bgcolor: "rgba(205,58,67,.24)" },
                    "& .MuiTreeItem-iconContainer": { color: "#758194", mr: 0.35 },
                    "& .MuiTreeItem-label": { fontSize: 12, lineHeight: 1.5 },
                    "& .MuiTreeItem-groupTransition": { ml: 1.3, pl: 0.6, borderLeft: "1px solid #303647" },
                  }}
                >
                  {phases.map((phase) => (
                    <TreeItem
                      key={phase}
                      itemId={`phase-${phase}`}
                      disableSelection
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: phaseColors[phase], boxShadow: `0 0 10px ${phaseColors[phase]}66` }} />
                          <Typography sx={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 0.9, color: "#e9edf3" }}>PHASE {phase}</Typography>
                          <Typography sx={{ ml: "auto", fontSize: 10, color: "#8894a4" }}>{movies.filter((m) => m.phase === phase).length}</Typography>
                        </Box>
                      }
                    >
                      {yearsByPhase[phase].map((year) => (
                        <TreeItem
                          key={`${phase}-${year}`}
                          itemId={`phase-${phase}-year-${year}`}
                          disableSelection
                          label={<Typography sx={{ fontSize: 11, letterSpacing: 0.5, fontWeight: 800, color: "#8f9cad" }}>{year}</Typography>}
                        >
                          {movies.filter((movie) => movie.phase === phase && movie.year === year).map((movie) => (
                            <TreeItem
                              key={movie.id}
                              itemId={`movie-${movie.id}`}
                              label={<Typography sx={{ fontSize: 11.5, lineHeight: 1.65, color: "inherit" }}>{movie.title}</Typography>}
                            />
                          ))}
                        </TreeItem>
                      ))}
                    </TreeItem>
                  ))}
                </SimpleTreeView>
              </Box>
              <Box sx={{ px: 2.4, py: 1.6, borderTop: "1px solid #262c38" }}>
                <Typography sx={{ color: "#6c788a", fontSize: 10, lineHeight: 1.7, letterSpacing: 0.4 }}>
                  SELECT A FILM TO READ ITS STORY & REVIEW.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box component="main" sx={{ minWidth: 0, flex: 1, width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2.5, mb: 2.8 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 10.5, color: "#f16b72", fontWeight: 900, letterSpacing: 2.4, mb: 0.8 }}>
                  {selectedMovie ? "NOW VIEWING / FEATURED FILM" : "EXPLORE / THE COLLECTION"}
                </Typography>
                <Typography component="h2" sx={{ fontSize: { xs: 25, md: 30 }, letterSpacing: -0.5, fontWeight: 900, lineHeight: 1.35 }}>
                  {selectedMovie ? "Film details & review" : "The film collection"}
                </Typography>
                <Typography sx={{ mt: 0.7, fontSize: 12, color: "#929baa" }}>
                  {selectedMovie ? "作品情報と鑑賞レビュー" : `${filteredMovies.length} titles in the archive`}
                </Typography>
              </Box>
              {selectedMovie ? (
                <Button onClick={showAllMovies} startIcon={<ArrowBackRoundedIcon />} sx={{ border: "1px solid #383f4d", bgcolor: "#141923", color: "#eff1f5", textTransform: "none", fontWeight: 800, px: 2, py: 1.1, borderRadius: 1.2, "&:hover": { bgcolor: "#232a38" } }}>
                  全作品に戻る
                </Button>
              ) : (
                <TextField
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  size="small"
                  placeholder="Search titles, years, reviews..."
                  aria-label="作品を検索"
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 19, color: "#8a95a8" }} /></InputAdornment>,
                      endAdornment: searchText ? (
                        <InputAdornment position="end">
                          <Box component="button" type="button" aria-label="検索をクリア" onClick={() => setSearchText("")} sx={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: 0, bgcolor: "transparent", color: "#8a95a8", p: 0.25 }}><CloseRoundedIcon sx={{ fontSize: 17 }} /></Box>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                  sx={{ width: { xs: "100%", sm: 290 }, "& .MuiOutlinedInput-root": { color: "#e8ecf5", bgcolor: "#151a24", borderRadius: 1.4, fontSize: 12.5, height: 45, "& fieldset": { borderColor: "#333a49" }, "&:hover fieldset": { borderColor: "#6d5160" }, "&.Mui-focused fieldset": { borderColor: "#e95b66" } }, "& input::placeholder": { color: "#80899b", opacity: 1 } }}
                />
              )}
            </Box>

            {/* 全作品モードのみフェーズ絞り込みを表示 */}
            {!selectedMovie && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 3, pb: 2.7, borderBottom: "1px solid #282c37" }}>
                {([
                  { key: "all" as const, label: "ALL PHASES" },
                  { key: 1 as const, label: "PHASE 01" },
                  { key: 2 as const, label: "PHASE 02" },
                  { key: 3 as const, label: "PHASE 03" },
                ]).map((filter) => {
                  const active = phaseFilter === filter.key;
                  return (
                    <Button
                      key={filter.key}
                      onClick={() => selectPhase(filter.key)}
                      size="small"
                      sx={{
                        px: 1.8, py: 0.9, borderRadius: 1, textTransform: "none", fontSize: 10.5,
                        fontWeight: 900, letterSpacing: 1.1,
                        border: "1px solid", borderColor: active ? "#ce4c57" : "#353b49",
                        bgcolor: active ? "rgba(208,63,78,.15)" : "transparent",
                        color: active ? "#ff8a93" : "#a8b2c2",
                        "&:hover": { bgcolor: "rgba(208,63,78,.15)", borderColor: "#ce4c57" },
                      }}
                    >
                      {filter.label}
                    </Button>
                  );
                })}
                <Typography sx={{ ml: "auto", fontSize: 11, color: "#778294", letterSpacing: 0.5 }}>
                  RELEASE ORDER <ArrowForwardRoundedIcon sx={{ fontSize: 13, verticalAlign: "middle", ml: 0.4 }} />
                </Typography>
              </Box>
            )}
            {/* 未選択: ポスター一覧 / 選択: ポスター+レビュー */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: selectedMovie
                  ? { xs: "minmax(0,1fr)", lg: "minmax(260px, .83fr) minmax(0, 1.17fr)" }
                  : { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" },
                gap: { xs: 2.2, md: 2.7 },
                alignItems: "start",
              }}
            >
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSelect={() => selectMovie(movie.id)} />
              ))}
              {selectedMovie && filteredMovies.length === 1 && <ReviewPanel movie={selectedMovie} />}
            </Box>

            {filteredMovies.length === 0 && (
              <Box sx={{ border: "1px dashed #3a4352", borderRadius: 2, p: 6, textAlign: "center", bgcolor: "#111620" }}>
                <SearchRoundedIcon sx={{ fontSize: 42, color: "#657083", mb: 1 }} />
                <Typography sx={{ fontWeight: 800, mb: 1 }}>該当する作品が見つかりませんでした</Typography>
                <Typography sx={{ color: muted, fontSize: 13, mb: 2 }}>別のキーワードで検索するか、全作品に戻ってください。</Typography>
                <Button onClick={showAllMovies} sx={{ color: "#ff858c", textTransform: "none" }}>すべて表示</Button>
              </Box>
            )}
          </Box>
        </Box>
        <Box component="footer" sx={{ borderTop: "1px solid #262c36", mt: 9, pt: 3.2, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 10, letterSpacing: 2, fontWeight: 850, color: "#737f90" }}>THE MCU ARCHIVE / MOVIE JOURNAL</Typography>
          <Typography sx={{ fontSize: 10, letterSpacing: 1.4, color: "#737f90" }}>23 STORIES · ONE UNIVERSE</Typography>
        </Box>
      </Box>
    </Box>
  );
}
