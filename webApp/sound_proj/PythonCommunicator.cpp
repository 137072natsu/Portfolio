
#include "PythonCommunicator.h"

#include <cstdio>
#include <stdexcept>
#include <utility>

namespace
{
    // プロンプトをBase64へ変換する
    std::string EncodeBase64(const std::string& input)
    {
        constexpr char table[] =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz"
            "0123456789+/";

        std::string output;

        for (size_t i = 0; i < input.size(); i += 3)
        {
            const unsigned int a =
                static_cast<unsigned char>(input[i]);

            const unsigned int b =
                i + 1 < input.size()
                ? static_cast<unsigned char>(input[i + 1])
                : 0;

            const unsigned int c =
                i + 2 < input.size()
                ? static_cast<unsigned char>(input[i + 2])
                : 0;

            output += table[a >> 2];
            output += table[((a & 3) << 4) | (b >> 4)];

            output += i + 1 < input.size()
                ? table[((b & 15) << 2) | (c >> 6)]
                : '=';

            output += i + 2 < input.size()
                ? table[c & 63]
                : '=';
        }

        return output;
    }
}

PythonCommunicator::PythonCommunicator(
    std::filesystem::path pythonPath,
    std::filesystem::path scriptPath)
    : m_pythonPath(std::move(pythonPath)),
      m_scriptPath(std::move(scriptPath))
{
}

// Python実行コマンドを作成
std::string PythonCommunicator::MakeCommand(
    std::string prompt) const
{
    const std::string encoded = EncodeBase64(prompt);

    return "\"" + m_pythonPath.u8string() + "\""
        + " -X utf8 "
        + "\"" + m_scriptPath.u8string() + "\""
        + " " + encoded;
}

// Pythonを実行し標準出力を受け取る
std::string PythonCommunicator::Execute(
    std::string prompt) const
{
    const std::string command = MakeCommand(prompt);

    FILE* pipe = _popen(command.c_str(), "r");

    if (pipe == nullptr)
    {
        throw std::runtime_error(
            "Pythonプロセスを起動できませんでした");
    }

    char buffer[2048]{};
    std::string result;

    // Pythonの標準出力を読み取る
    while (fgets(buffer, sizeof(buffer), pipe) != nullptr)
    {
        result += buffer;
    }

    // Pythonプロセスの終了を待つ
    const int exitCode = _pclose(pipe);

    if (exitCode != 0)
    {
        throw std::runtime_error(
            "Python実行失敗: 終了コード "
            + std::to_string(exitCode));
    }

    return result;
}
