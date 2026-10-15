main.cpp（Win32 GUI）
    │
    │ 「音声解析」ボタン
    ▼
DataManager
    │
    ├─ 指定Cueを再生
    ├─ PCMコールバックで音声取得
    └─ analysis.wav に保存
    │
    ▼
Python / FastAPI
    │
    ├─ WAVファイルを読み込む
    ├─ Azure OpenAIに音声を送信
    └─ 音声の説明文を生成
    │
    ▼
sound_catalog.json
    │
    └─ cue_name / description
