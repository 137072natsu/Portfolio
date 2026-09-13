import os
import sys
from typing import Any

# This client supports two backends:
# - If OLLAMA_API_URL is set, send the prompt to that URL (local Ollama HTTP endpoint)
#   The expected JSON request is {"model": "<model>", "prompt": "..."}
#   The response may vary by Ollama setup; this code tries common keys.
# - Otherwise it falls back to OpenAI using the OPENAI_API_KEY environment variable.


def _call_ollama(prompt: str) -> str:
    ollama_url = os.getenv("OLLAMA_API_URL")
    if not ollama_url:
        raise RuntimeError("OLLAMA_API_URL not configured")

    model = os.getenv("OLLAMA_MODEL", "llama2")

    try:
        import requests
    except Exception:  # pragma: no cover - runtime dependency
        raise RuntimeError("Python package 'requests' is required to call Ollama. Install with: pip install requests")

    payload = {"model": model, "prompt": prompt}

    try:
        resp = requests.post(ollama_url, json=payload, timeout=60)
        resp.raise_for_status()
    except Exception as exc:
        raise RuntimeError(f"Failed to call Ollama at {ollama_url}: {exc}") from exc

    try:
        data: Any = resp.json()
    except Exception:
        # return raw text if not json
        return resp.text

    # Try common response shapes
    if isinstance(data, dict):
        for key in ("response", "text", "output", "result"):
            if key in data:
                return data[key]

        if "generations" in data and data["generations"]:
            first = data["generations"][0]
            if isinstance(first, dict) and "text" in first:
                return first["text"]

        # fallback to stringified json
        return str(data)

    return str(data)


def _call_openai(prompt: str) -> str:
    try:
        from openai import OpenAI  # type: ignore[import]
    except Exception:  # pragma: no cover - runtime dependency
        raise RuntimeError("Python package 'openai' is required for OpenAI backend. Install with: pip install openai")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Please set it in your environment before calling OpenAI."
        )

    client = OpenAI(api_key=api_key)

    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=prompt,
        )
        # Best-effort extraction similar to prior implementation
        for item in getattr(response, "output", []):
            if getattr(item, "type", None) == "message":
                content = getattr(item, "content", None)
                if content:
                    return getattr(content[0], "text", "")

        return str(response)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"OpenAI request failed: {exc}") from exc


def extract_text_from_response(response) -> str:
    # keep backward-compatible extractor for OpenAI-style responses
    for item in getattr(response, "output", []):
        if getattr(item, "type", None) == "message":
            content = getattr(item, "content", None)
            if content:
                return getattr(content[0], "text", "")

    return "No response available."


def get_ai_response(prompt: str) -> str:
    # Prefer Ollama if configured, otherwise fall back to OpenAI
    if os.getenv("OLLAMA_API_URL"):
        return _call_ollama(prompt)

    return _call_openai(prompt)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(get_ai_response(sys.argv[1]))
    else:
        print("No prompt provided.")
