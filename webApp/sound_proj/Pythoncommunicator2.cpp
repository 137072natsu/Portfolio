
#include <windows.h>
#include <vector>

// UTF-8からWindowsのUTF-16文字列へ変換
namespace
{
    std::wstring ToWide(const std::string& s)
    {
        if (s.empty()) return L"";

        int size = MultiByteToWideChar(
            CP_UTF8, MB_ERR_INVALID_CHARS,
            s.data(), static_cast<int>(s.size()),
            nullptr, 0);

        if (size == 0)
            throw std::runtime_error("UTF-8変換失敗");

        std::wstring result(size, L'\0');

        if (MultiByteToWideChar(
            CP_UTF8, MB_ERR_INVALID_CHARS,
            s.data(), static_cast<int>(s.size()),
            result.data(), size) == 0)
        {
            throw std::runtime_error("UTF-8変換失敗");
        }

        return result;
    }
}

std::string PythonCommunicator::ExecuteGui(
    std::string prompt) const
{
    SECURITY_ATTRIBUTES sa{};
    sa.nLength = sizeof(sa);
    sa.bInheritHandle = TRUE;

    HANDLE readPipe = nullptr;
    HANDLE writePipe = nullptr;

    if (!CreatePipe(&readPipe, &writePipe, &sa, 0))
        throw std::runtime_error("CreatePipe failed");

    // 親プロセスの読み取り側は子に継承しない
    if (!SetHandleInformation(
        readPipe, HANDLE_FLAG_INHERIT, 0))
    {
        CloseHandle(readPipe);
        CloseHandle(writePipe);
        throw std::runtime_error("Pipe setup failed");
    }

    // GUIアプリでも有効な標準入力を用意する
    HANDLE nullInput = CreateFileW(
        L"NUL", GENERIC_READ,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        &sa, OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL, nullptr);

    if (nullInput == INVALID_HANDLE_VALUE)
    {
        CloseHandle(readPipe);
        CloseHandle(writePipe);
        throw std::runtime_error("Input setup failed");
    }

    STARTUPINFOW si{};
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESTDHANDLES;
    si.hStdInput = nullInput;
    si.hStdOutput = writePipe;
    si.hStdError = writePipe;

    PROCESS_INFORMATION pi{};

    const std::wstring exe = m_pythonPath.wstring();
    const std::wstring command =
        ToWide(MakeCommand(std::move(prompt)));

    // CreateProcessWには変更可能な文字列を渡す
    std::vector<wchar_t> cmd(
        command.begin(), command.end());
    cmd.push_back(L'\0');

    BOOL created = CreateProcessW(
        exe.c_str(),
        cmd.data(),
        nullptr, nullptr,
        TRUE,
        CREATE_NO_WINDOW,
        nullptr, nullptr,
        &si, &pi);

    CloseHandle(writePipe);
    CloseHandle(nullInput);

    if (!created)
    {
        CloseHandle(readPipe);
        throw std::runtime_error("Python起動失敗");
    }

    // Pythonの標準出力を取得
    char buffer[2048];
    DWORD bytesRead = 0;
    std::string result;

    while (ReadFile(
        readPipe,
        buffer,
        sizeof(buffer),
        &bytesRead,
        nullptr) && bytesRead > 0)
    {
        result.append(buffer, bytesRead);
    }

    CloseHandle(readPipe);

    WaitForSingleObject(pi.hProcess, INFINITE);

    DWORD exitCode = 0;
    const BOOL gotExitCode =
        GetExitCodeProcess(pi.hProcess, &exitCode);

    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);

    if (!gotExitCode || exitCode != 0)
    {
        throw std::runtime_error(
            "Python実行失敗: " + result);
    }

    return result;
}
