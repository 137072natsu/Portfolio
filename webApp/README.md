# CRI ADX PCM → WAV → Azure OpenAI (Win32 demo)

## 前提
- Windows / VS2022, C++17 以降, x64 の CRI ADX Native SDK (WASAPI)
- SDK include/lib の設定、ランタイムDLL配置は付属サンプルに従って行う。
- `nlohmann/json.hpp` をインクルードできるようにする。`WinHTTP` は AnalyzeClient.cpp に `#pragma comment(lib,"winhttp.lib")`。
- `assets/SampleProject.acf` と `assets/AtomCueSheet.acb`、必要に応じ同名の AWB を配置。外部AWBがあれば `main.cpp` の `AWB_PATH` を編集。
- ビルドした実行ファイルの**作業ディレクトリ**をこのプロジェクトルートに設定。
- このデモは **1 ACF + 1 ACB** に対応し、主に単一波形Cue（最大15秒・モノラル/ステレオ）用。

## Pythonの起動 (ルートディレクトリから)
```
python -m venv .venv
.venv\Scripts\activate
pip install -r python\requirements.txt
set AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
set AZURE_OPENAI_API_KEY=YOUR_KEY
set AZURE_OPENAI_AUDIO_DEPLOYMENT=YOUR_AUDIO_DEPLOYMENT_NAME
python -m uvicorn python.server:app --host 127.0.0.1 --port 8000
```
PowerShellなら `$env:AZURE_OPENAI_ENDPOINT="..."` などを使ってください。
Azure OpenAI側では `input_audio` を受け付ける音声対応モデルをデプロイしてください。API バージョンはデフォルト `2025-01-01-preview`、適切なバージョンに合わせるときは `AZURE_OPENAI_API_VERSION` を設定してください。

## 流れ
1. Pythonを先に起動する。
2. VS2022で `main.cpp`, `DataManager.cpp`, `PcmRecorder.cpp`, `AnalyzeClient.cpp` をプロジェクトに追加する。
3. 画面のCue名（半角英数字を想定）を入力し「音声解析 (AI)」を押す。
4. `captures/capture.wav` に16-bit PCM WAVを書き出す（15秒またはCueの終端まで）。
5. C++ は `/analyze` に `{ "cue_name": "...", "acb_name": "...", "wav_file": "capture.wav" }` をPOSTする。
6. Python が captures を確認し、AzureにWAVを送信して `sound_catalog.json` を更新する。

## 制限と注意
- `CriAtomExWaveformInfo.sampling_rate` / `num_channels` はCueの最初の波形を対象とします。複数波形、HCA-MX等、ストリーム設定、DSPバスを含むCueの録音には他の方法（ASRバス録音）が必要になることがあります。
- 再生タイミングでPCMを収集するため、Cueがループしても15秒で止めます。
- Player Filter callbackではその波形のデコードPCMを取り込みます。ポストエフェクト後の実際のバスミックスとは異なります。
- 解析ボタンは `capture.wav` を使い回します。並列で複数解析する場合はファイル名とCue名をそれぞれ固定したリクエストに変更してください。
- WAV書き込みはGUIスレッドなので短いSE向きです。長尺・実製品では専用I/Oスレッドとロックフリーリングバッファを使用してください。
- Windowsイベント通知のworkerはデモ用にdetachしています。製品版ではウィンドウ破棄時のキャンセル・Join・完了通知の所有権を整理してください。
- AIは効果音の認識に不正確な場合があります。音声入力ができても何が鳴ったか正しく分類できる保証はありません。
- SDKと実ACBが手元にないため、このコードはCRI SDKでのビルド・実再生未検証です。
