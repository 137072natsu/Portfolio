
import sys
import base64

def main():
    # C++から受け取ったBase64文字列
    encoded_prompt = sys.argv[1]

    # UTF-8の元のプロンプトに戻す
    prompt = base64.b64decode(
        encoded_prompt,
        validate=True
    ).decode("utf-8")

    # ここに実装済みのAzure OpenAI処理を入れる
    # result = your_ai_function(prompt)

    # まずは通信確認用
    result = f"受け取ったプロンプト: {prompt}"

    # C++へ標準出力で返す
    print(result, flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
