
#pragma once

#include <string>
#include <filesystem>

class PythonCommunicator
{
public:
    PythonCommunicator(
        std::filesystem::path pythonPath,
        std::filesystem::path scriptPath);

    // Pythonの実行コマンドを生成
    std::string MakeCommand(std::string prompt) const;

    // コンソール用：_popenで実行
    std::string Execute(std::string prompt) const;

private:
    std::filesystem::path m_pythonPath;
    std::filesystem::path m_scriptPath;
};
