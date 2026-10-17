    if not wav_path.is_relative_to(CAPTURES) or not wav_path.is_file():
        raise HTTPException(status_code=404, detail="WAV not found")
    if not (44 < wav_path.stat().st_size <= 20 * 1024 * 1024):
        raise HTTPException(status_code=400, detail="WAV size out of range")

    try:
        with wave.open(str(wav_path), "rb") as wf:
            if wf.getsampwidth() != 2 or wf.getnchannels() not in (1, 2):
                raise ValueError("Expected mono/stereo 16-bit PCM WAV")
            if wf.getnframes() == 0:
                raise ValueError("WAV contains no samples")
    except (wave.Error, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    client = AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2025-01-01-preview"),
        timeout=60.0,
    )
    audio_b64 = base64.b64encode(wav_path.read_bytes()).decode("ascii")
    try:
        completion = client.chat.completions.create(
            model=os.environ["AZURE_OPENAI_AUDIO_DEPLOYMENT"],
            modalities=["text"],
            messages=[
                {
                    "role": "system",
                    "content": (
                        "あなたはゲームの効果音分類担当です。入力音声を聞いて、"
                        "聞こえるものを日本語で1〜2文で説明してください。"
                        "不確かな場合は『判別困難』と書いてください。"
                        "音に存在しない情報を推測してはいけません。"
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "この効果音の音響的特徴を説明してください。"},
                        {"type": "input_audio", "input_audio": {"data": audio_b64, "format": "wav"}},
                    ],
                },
            ],
        )
        description = completion.choices[0].message.content
        if not isinstance(description, str) or not description.strip():
            raise ValueError("Azure OpenAI returned no textual description")
    except Exception as e:
        # 詳細はローカルサーバーログへ。APIキー等はGUIへ返さない
        raise HTTPException(status_code=502, detail=f"Audio inference failed: {type(e).__name__}") from e

    item = {
        "cue_name": req.cue_name,
        "acb_name": req.acb_name,
        "wav_file": req.wav_file,
        "description": description.strip(),
        "source": "azure_audio_analysis",
    }

   with LOCK:
        items = []
        if CATALOG.exists():
            items = json.loads(CATALOG.read_text(encoding="utf-8"))
        items = [x for x in items if not (x.get("cue_name") == req.cue_name
                                      and x.get("acb_name") == req.acb_name)]
        items.append(item)
        tmp = CATALOG.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(CATALOG)
    return item
