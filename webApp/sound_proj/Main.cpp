#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <array>
#include <filesystem>
#include <memory>
#include <string>
#include <thread>
#include <utility>
#include "AnalyzeClient.h"

#include "DataManager.h"

namespace
{
    constexpr int ID_PLAY = 1001;
    constexpr int ID_STOP = 1002;
    constexpr int ID_EXIT = 1003;
    constexpr int ID_ANALYZE = 1004;
    constexpr UINT WM_APP_ANALYZE_DONE = WM_APP + 10;
    constexpr UINT_PTR TIMER_STATUS = 1;

    // CRI Atom Craftから書き出したファイルに合わせて変更する
    constexpr const char* ACF_PATH = "assets/SampleProject.acf";
    constexpr const char* ACB_PATH = "assets/AtomCueSheet.acb";
    // 外部AWBがある場合のみ "assets/AtomCueSheet.awb" のように指定
    constexpr const char* AWB_PATH = nullptr;

    DataManager g_audio;
    HWND g_editCue = nullptr;
    HWND g_textStatus = nullptr;
    HWND g_buttonPlay = nullptr;
    HWND g_buttonStop = nullptr;
    HWND g_buttonAnalyze = nullptr;
    HWND g_textAi = nullptr;
    bool g_aiBusy = false;
    std::string g_captureCue;

    std::wstring Utf8ToWide(const std::string& s) {
        if (s.empty()) return {};
        int n = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS,
            s.data(), static_cast<int>(s.size()), nullptr, 0);
        if (!n) return L"(文字コードエラー)";
        std::wstring w(n, L'\0');
        MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS,
            s.data(), static_cast<int>(s.size()), w.data(), n);
        return w;
    }

    std::string GetCueName() {
        std::array<char, 256> name{};
        // サンプルは半角英数字のCue名を想定
        GetWindowTextA(g_editCue, name.data(), static_cast<int>(name.size()));
        return name.data();
    }

    void RequestAi(HWND hwnd, const std::string& cueName,
                   const std::string& wavFile) {
        g_aiBusy = true;
        EnableWindow(g_buttonAnalyze, FALSE);
        SetWindowTextW(g_textAi, L"Azure OpenAIで解析中...");
        std::thread([hwnd, cueName, wavFile]() {
            std::string result;
            try {
                result = AnalyzeWavHttp(cueName, wavFile, ACB_PATH);
            } catch (const std::exception& e) {
                result = "ERROR: ";
                result += e.what();
            }
            auto ptr = std::make_unique<std::string>(std::move(result));
            if (PostMessageW(hwnd, WM_APP_ANALYZE_DONE, 0,
                             reinterpret_cast<LPARAM>(ptr.get())))
                ptr.release();
        }).detach();
    }

    HWND AddControl(HWND parent, const wchar_t* klass,
                    const wchar_t* title, DWORD style,
                    int x, int y, int width, int height, int id = 0,
                    DWORD exStyle = 0)
    {
        HWND control = CreateWindowExW(
            exStyle, klass, title, WS_CHILD | WS_VISIBLE | style,
            x, y, width, height, parent,
            reinterpret_cast<HMENU>(static_cast<INT_PTR>(id)),
            GetModuleHandleW(nullptr), nullptr);

        if (control != nullptr)
            SendMessageW(control, WM_SETFONT,
                         reinterpret_cast<WPARAM>(GetStockObject(DEFAULT_GUI_FONT)),
                         TRUE);
        return control;
    }

    void RefreshStatus()
    {
        if (!g_audio.IsReady())
                        }
            break;

        case WM_TIMER:
            if (wParam == TIMER_STATUS)
            {
                g_audio.Update();      // CRIの内部状態を更新
                RefreshStatus();       // 表示も定期更新する
                const std::string saved = g_audio.ConsumeSavedWav();
                if (!saved.empty() && !g_aiBusy) {
                    RequestAi(hwnd, g_captureCue, "capture.wav");
                }
                return 0;
            }
            break;

        case WM_APP_ANALYZE_DONE:
        {
            std::unique_ptr<std::string> result(reinterpret_cast<std::string*>(lParam));
            g_aiBusy = false;
            EnableWindow(g_buttonAnalyze, TRUE);
            std::wstring info = L"解析結果: " + Utf8ToWide(*result);
            SetWindowTextW(g_textAi, info.c_str());
            return 0;
        }

        case WM_CLOSE:
            DestroyWindow(hwnd);
            return 0;

        case WM_DESTROY:
            KillTimer(hwnd, TIMER_STATUS);
            g_audio.Shutdown();
            PostQuitMessage(0);
            return 0;
        }
        return DefWindowProcW(hwnd, msg, wParam, lParam);
    }
}

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE,
                    PWSTR, int showCommand)
{
    const wchar_t* CLASS_NAME = L"CriAdxCuePlayerWindow";

    WNDCLASSW wc{};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = instance;
    wc.lpszClassName = CLASS_NAME;
    wc.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    wc.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);

    if (!RegisterClassW(&wc))
        return 1;

    RECT rect{0, 0, 630, 310};
    const DWORD windowStyle = WS_OVERLAPPED | WS_CAPTION |
                               WS_SYSMENU | WS_MINIMIZEBOX;
    AdjustWindowRect(&rect, windowStyle, FALSE);

    HWND hwnd = CreateWindowExW(
        0, CLASS_NAME, L"CRI ADX - Cue PCM Audio Analyzer",
        windowStyle, CW_USEDEFAULT, CW_USEDEFAULT,
        rect.right - rect.left, rect.bottom - rect.top,
        nullptr, nullptr, instance, nullptr);
    if (hwnd == nullptr)
        return 1;

    // GUIを生成してからAudioManagerを初期化
    if (!g_audio.Initialize(ACF_PATH, ACB_PATH, AWB_PATH))
    {
        MessageBoxW(hwnd,
            L"CRI ADXの初期化に失敗しました。\n"
            L"ACF/ACBの場所、SDKの設定を確認してください。\n"
            L"詳しいCRIエラーはVisual Studioの出力ウィンドウを確認してください。",
            L"初期化エラー", MB_OK | MB_ICONERROR);
        DestroyWindow(hwnd);
        return 1;
    }

    RefreshStatus();
    SetTimer(hwnd, TIMER_STATUS, 33, nullptr); // 約30回/秒
    ShowWindow(hwnd, showCommand);
    UpdateWindow(hwnd);
    SetFocus(g_editCue);

    MSG msg{};
    while (GetMessageW(&msg, nullptr, 0, 0) > 0)
    {
        // 子のEDITやBUTTONにフォーカスがあってもEscで終了する
        if (msg.message == WM_KEYDOWN && msg.wParam == VK_ESCAPE)
        {
            SendMessageW(hwnd, WM_CLOSE, 0, 0);
            continue;
        }
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    return static_cast<int>(msg.wParam);
}
