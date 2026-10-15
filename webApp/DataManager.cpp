#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <array>

#include "DataManager.h"

namespace
{
    constexpr int ID_PLAY = 1001;
    constexpr int ID_STOP = 1002;
    constexpr int ID_EXIT = 1003;
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
            return;

        const CriAtomExPlayerStatus status = g_audio.GetStatus();
        const wchar_t* label = L"不明";
        switch (status)
        {
        case CRIATOMEXPLAYER_STATUS_STOP:    label = L"停止中"; break;
        case CRIATOMEXPLAYER_STATUS_PREP:    label = L"再生準備中"; break;
        case CRIATOMEXPLAYER_STATUS_PLAYING: label = L"再生中"; break;
        case CRIATOMEXPLAYER_STATUS_PLAYEND: label = L"再生完了"; break;
        case CRIATOMEXPLAYER_STATUS_ERROR:   label = L"エラー"; break;
        }
        SetWindowTextW(g_textStatus, label);

        const bool active = (status == CRIATOMEXPLAYER_STATUS_PREP ||
                             status == CRIATOMEXPLAYER_STATUS_PLAYING);
        EnableWindow(g_buttonPlay, active ? FALSE : TRUE);
        EnableWindow(g_buttonStop, active ? TRUE : FALSE);
    }

    LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
    {
        switch (msg)
        {
        case WM_CREATE:
            AddControl(hwnd, L"STATIC", L"キュー名:", 0, 20, 24, 85, 24);
            g_editCue = AddControl(hwnd, L"EDIT", L"BGM_Main",
                                   ES_AUTOHSCROLL | WS_TABSTOP,
                                   112, 18, 330, 28, 0, WS_EX_CLIENTEDGE);

            AddControl(hwnd, L"STATIC", L"再生状態:", 0, 20, 85, 85, 24);
            g_textStatus = AddControl(hwnd, L"STATIC", L"未初期化",
                                      0, 112, 85, 200, 24);

            g_buttonPlay = AddControl(hwnd, L"BUTTON", L"再生",
                                      BS_PUSHBUTTON | WS_TABSTOP,
                                      20, 138, 128, 40, ID_PLAY);
            g_buttonStop = AddControl(hwnd, L"BUTTON", L"停止",
                                      BS_PUSHBUTTON | WS_TABSTOP,
                                      168, 138, 128, 40, ID_STOP);
            AddControl(hwnd, L"BUTTON", L"終了 (Esc)",
                       BS_PUSHBUTTON | WS_TABSTOP,
                       316, 138, 128, 40, ID_EXIT);
            return 0;

        case WM_COMMAND:
            if (HIWORD(wParam) == BN_CLICKED)
            {
                const int id = LOWORD(wParam);
                if (id == ID_PLAY)
                {
                    std::array<char, 256> cueName{};
                    // サンプルはASCIIキュー名を想定している
                    GetWindowTextA(g_editCue, cueName.data(),
                                   static_cast<int>(cueName.size()));
                    if (!g_audio.PlayCue(cueName.data()))
                    {
                        MessageBoxW(hwnd,
                            L"再生できませんでした。\n"
                            L"キュー名・ACB・Voice Poolの設定を確認してください。",
                            L"CRI ADX", MB_OK | MB_ICONWARNING);
                    }
                    RefreshStatus();
                    return 0;
                }
                if (id == ID_STOP)
                {
                    g_audio.Stop();
                    RefreshStatus();
                    return 0;
                }
                if (id == ID_EXIT)
                {
                    SendMessageW(hwnd, WM_CLOSE, 0, 0);
                    return 0;
                }
            }
            break;

        case WM_TIMER:
            if (wParam == TIMER_STATUS)
            {
                g_audio.Update();      // CRIの内部状態を更新
                RefreshStatus();       // 表示も定期更新する
                return 0;
            }
            break;

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

    RECT rect{0, 0, 465, 210};
    const DWORD windowStyle = WS_OVERLAPPED | WS_CAPTION |
                               WS_SYSMENU | WS_MINIMIZEBOX;
    AdjustWindowRect(&rect, windowStyle, FALSE);

    HWND hwnd = CreateWindowExW(
        0, CLASS_NAME, L"CRI ADX - ACB Cue Player",
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
