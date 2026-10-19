
#define WIN32_LEAN_AND_MEAN

#include <windows.h>
#include <commdlg.h>

#include "DataConverter.h"

#include <filesystem>
#include <string>
#include <thread>

#pragma comment(lib, "Comdlg32.lib")

namespace fs = std::filesystem;

// コントロールID
enum
{
    IDC_ACF = 100,
    IDC_ACB,
    IDC_AWB,
    IDC_JSON,

    IDC_BROWSE_ACF,
    IDC_BROWSE_ACB,
    IDC_BROWSE_AWB,
    IDC_BROWSE_JSON,

    IDC_CONVERT,
    IDC_STATUS
};

constexpr UINT WM_CONVERT_DONE = WM_APP + 1;

// GUIのハンドル
HWND gAcf = nullptr;
HWND gAcb = nullptr;
HWND gAwb = nullptr;
HWND gJson = nullptr;
HWND gConvert = nullptr;
HWND gStatus = nullptr;

// 解析スレッド
std::thread gWorker;

bool gBusy = false;
bool gCloseRequested = false;

// =====================================
// Editのテキスト取得
// =====================================
std::wstring GetText(HWND edit)
{
    int length = GetWindowTextLengthW(edit);

    std::wstring result(
        static_cast<size_t>(length) + 1, L'\0');

    GetWindowTextW(edit, result.data(), length + 1);
    result.resize(length);

    return result;
}

// =====================================
// 既存ファイル選択ダイアログ
// =====================================
void SelectFile(
    HWND hwnd,
    HWND edit,
    const wchar_t* filter)
{
    wchar_t path[MAX_PATH]{};

    OPENFILENAMEW ofn{};
    ofn.lStructSize = sizeof(ofn);
    ofn.hwndOwner = hwnd;
    ofn.lpstrFile = path;
    ofn.nMaxFile = MAX_PATH;
    ofn.lpstrFilter = filter;
    ofn.Flags = OFN_FILEMUSTEXIST |
                OFN_PATHMUSTEXIST;

    if (GetOpenFileNameW(&ofn))
    {
        SetWindowTextW(edit, path);
    }
}

// =====================================
// JSON保存先選択
// =====================================
void SelectJsonPath(HWND hwnd)
{
    wchar_t path[MAX_PATH] = L"sound_catalog.json";

    OPENFILENAMEW ofn{};
    ofn.lStructSize = sizeof(ofn);
    ofn.hwndOwner = hwnd;
    ofn.lpstrFile = path;
    ofn.nMaxFile = MAX_PATH;
    ofn.lpstrFilter =
        L"JSON Files (*.json)\0*.json\0\0";
    ofn.lpstrDefExt = L"json";
    ofn.Flags = OFN_OVERWRITEPROMPT |
                OFN_PATHMUSTEXIST;

    if (GetSaveFileNameW(&ofn))
    {
        SetWindowTextW(gJson, path);
    }
}

// =====================================
// GUIコントロール作成用
// =====================================
HWND AddControl(
    HWND parent,
    const wchar_t* type,
    const wchar_t* title,
    DWORD style,
    int x, int y, int w, int h,
    int id)
{
    return CreateWindowW(
        type,
        title,
        WS_CHILD | WS_VISIBLE | style,
        x, y, w, h,
        parent,
        reinterpret_cast<HMENU>(
            static_cast<INT_PTR>(id)),
        GetModuleHandleW(nullptr),
        nullptr);
}

// =====================================
// 解析開始
// =====================================
void StartConvert(HWND hwnd)
{
    if (gBusy)
        return;

    const fs::path acf = GetText(gAcf);
    const fs::path acb = GetText(gAcb);
    const fs::path awb = GetText(gAwb);
    const fs::path output = GetText(gJson);

    // 入力チェック
    if (!fs::is_regular_file(acf) ||
        !fs::is_regular_file(acb) ||
        (!awb.empty() && !fs::is_regular_file(awb)) ||
        output.empty())
    {
        MessageBoxW(
            hwnd,
            L"ACF・ACB・JSON出力先を確認してください。",
            L"入力エラー",
            MB_OK | MB_ICONWARNING);

        return;
    }

    gBusy = true;
    EnableWindow(gConvert, FALSE);

    SetWindowTextW(
        gStatus, L"解析中...");

    // GUIとは別のスレッドで解析する
    gWorker = std::thread(
        [hwnd, acf, acb, awb, output]()
        {
            bool success = false;

            try
            {
                DataConverter converter;

                success = converter.Convert(
                    acf,
                    acb,
                    awb,
                    output);
            }
            catch (...)
            {
                success = false;
            }

            // GUIスレッドへ完了通知
            PostMessageW(
                hwnd,
                WM_CONVERT_DONE,
                success ? 1 : 0,
                0);
        });
}

// =====================================
// ウィンドウメッセージ処理
// =====================================
LRESULT CALLBACK WindowProc(
    HWND hwnd,
    UINT message,
    WPARAM wParam,
    LPARAM lParam)
{
    switch (message)
    {
    case WM_CREATE:
    {
        AddControl(
            hwnd, L"STATIC", L"ACFファイル",
            0, 20, 15, 200, 20, -1);

        gAcf = AddControl(
            hwnd, L"EDIT", L"",
            WS_BORDER | ES_AUTOHSCROLL,
            20, 38, 540, 28, IDC_ACF);

        AddControl(
            hwnd, L"BUTTON", L"参照",
            BS_PUSHBUTTON,
            575, 38, 100, 28,
            IDC_BROWSE_ACF);

        AddControl(
            hwnd, L"STATIC", L"ACBファイル",
            0, 20, 80, 200, 20, -1);

        gAcb = AddControl(
            hwnd, L"EDIT", L"",
            WS_BORDER | ES_AUTOHSCROLL,
            20, 103, 540, 28, IDC_ACB);

        AddControl(
            hwnd, L"BUTTON", L"参照",
            BS_PUSHBUTTON,
            575, 103, 100, 28,
            IDC_BROWSE_ACB);

        AddControl(
            hwnd, L"STATIC", L"AWB（任意）",
            0, 20, 145, 200, 20, -1);

        gAwb = AddControl(
            hwnd, L"EDIT", L"",
            WS_BORDER | ES_AUTOHSCROLL,
            20, 168, 540, 28, IDC_AWB);

        AddControl(
            hwnd, L"BUTTON", L"参照",
            BS_PUSHBUTTON,
            575, 168, 100, 28,
            IDC_BROWSE_AWB);

        AddControl(
            hwnd, L"STATIC", L"JSON出力先",
            0, 20, 210, 200, 20, -1);

        gJson = AddControl(
            hwnd, L"EDIT", L"sound_catalog.json",
            WS_BORDER | ES_AUTOHSCROLL,
            20, 233, 540, 28, IDC_JSON);

        AddControl(
            hwnd, L"BUTTON", L"参照",
            BS_PUSHBUTTON,
            575, 233, 100, 28,
            IDC_BROWSE_JSON);

        gConvert = AddControl(
            hwnd, L"BUTTON", L"解析開始",
            BS_DEFPUSHBUTTON,
            20, 290, 180, 40,
            IDC_CONVERT);

        gStatus = AddControl(
            hwnd, L"STATIC", L"待機中",
            SS_LEFT,
            20, 350, 650, 40,
            IDC_STATUS);

        return 0;
    }

    case WM_COMMAND:
    {
        switch (LOWORD(wParam))
        {
        case IDC_BROWSE_ACF:
            SelectFile(
                hwnd, gAcf,
                L"ACF Files (*.acf)\0*.acf\0\0");
            return 0;

        case IDC_BROWSE_ACB:
            SelectFile(
                hwnd, gAcb,
                L"ACB Files (*.acb)\0*.acb\0\0");
            return 0;

        case IDC_BROWSE_AWB:
            SelectFile(
                hwnd, gAwb,
                L"AWB Files (*.awb)\0*.awb\0\0");
            return 0;

        case IDC_BROWSE_JSON:
            SelectJsonPath(hwnd);
            return 0;

        case IDC_CONVERT:
            StartConvert(hwnd);
            return 0;
        }
        break;
    }

    case WM_CONVERT_DONE:
    {
        // ワーカースレッドの終了を確認
        if (gWorker.joinable())
            gWorker.join();

        gBusy = false;

        if (gCloseRequested)
        {
            DestroyWindow(hwnd);
            return 0;
        }

        EnableWindow(gConvert, TRUE);

        SetWindowTextW(
            gStatus,
            wParam
                ? L"解析完了：JSONを書き出しました"
                : L"解析失敗：ACF・ACBなどを確認してください");

        return 0;
    }

    case WM_CLOSE:
    {
        if (gBusy)
        {
            // 解析途中でリソースを破棄しない
            gCloseRequested = true;

            SetWindowTextW(
                gStatus,
                L"解析処理の終了後にウィンドウを閉じます");

            return 0;
        }

        DestroyWindow(hwnd);
        return 0;
    }

    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }

    return DefWindowProcW(
        hwnd, message, wParam, lParam);
}

// =====================================
// エントリーポイント
// =====================================
int WINAPI wWinMain(
    HINSTANCE instance,
    HINSTANCE,
    PWSTR,
    int show)
{
    const wchar_t* className =
        L"CriAdxAnalyzerWindow";

    WNDCLASSW wc{};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = instance;
    wc.lpszClassName = className;
    wc.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    wc.hbrBackground =
        reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);

    RegisterClassW(&wc);

    HWND hwnd = CreateWindowW(
        className,
        L"CRI ADX - Data Converter",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        720, 460,
        nullptr, nullptr,
        instance, nullptr);

    if (!hwnd)
        return 1;

    ShowWindow(hwnd, show);
    UpdateWindow(hwnd);

    MSG msg{};

    while (GetMessageW(
        &msg, nullptr, 0, 0) > 0)
    {
        // Escキーで終了
        if (msg.message == WM_KEYDOWN &&
            msg.wParam == VK_ESCAPE)
        {
            PostMessageW(hwnd, WM_CLOSE, 0, 0);
            continue;
        }

        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    if (gWorker.joinable())
        gWorker.join();

    return static_cast<int>(msg.wParam);
}
