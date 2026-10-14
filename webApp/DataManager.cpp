include "DataManager.h"

#include <cstdlib>
#include <iostream>

namespace
{
    // CRIが内部で使用するメモリの確保
    void* CriMalloc(void* obj, CriUint32 size)
    {
        return std::malloc(size);
    }

    // CRIが確保したメモリの解放
    void CriFree(void* obj, void* mem)
    {
        std::free(mem);
    }

    // CRIのエラーをコンソールに表示
    void CriErrorCallback(
        const CriChar8* errid,
        CriUint32 p1,
        CriUint32 p2,
        CriUint32* parray)
    {
        const CriChar8* message =
            criErr_ConvertIdToMessage(errid, p1, p2);

        if (message != nullptr)
        {
            std::cerr << "[CRI] " << message << '\n';
        }
    }
}

DataManager::~DataManager()
{
    Finalize();
}

bool DataManager::Initialize(
    const char* acfPath,
    const char* acbPath)
{
    if (libraryInitialized)
        return false;

    // ① エラーコールバック登録
    criErr_SetCallback(CriErrorCallback);

    // ② メモリアロケーター登録
    criAtomEx_SetUserAllocator(
        CriMalloc, CriFree, nullptr);

    // ③ CRI ADXライブラリの初期化
    criAtomEx_Initialize_WASAPI(
        nullptr, nullptr, 0);

    libraryInitialized = true;

    // ④ ACFファイルの登録
    if (criAtomEx_RegisterAcfFile(
        nullptr, acfPath, nullptr, 0) != CRI_TRUE)
    {
        Finalize();
        return false;
    }

    acfRegistered = true;

    // ⑤ ACBファイルのロード
    acb_hn = criAtomExAcb_LoadAcbFile(
        nullptr, acbPath,
        nullptr, nullptr,
        nullptr, 0);

    if (acb_hn == nullptr)
    {
        Finalize();
        return false;
    }

    // ⑥ ボイスプールの作成
    voice_pool =
        criAtomExVoicePool_AllocateStandardVoicePool(
            nullptr, nullptr, 0);

    if (voice_pool == nullptr)
    {
        Finalize();
        return false;
    }

    // ⑦ プレイヤーの作成
    player = criAtomExPlayer_Create(
        nullptr, nullptr, 0);

    if (player == nullptr)
    {
        Finalize();
        return false;
    }

    return true;
}

void DataManager::PlayCue(const char* cueName)
{
    if (player == nullptr || acb_hn == nullptr)
        return;

    // ACB内のキューを名前で指定
    criAtomExPlayer_SetCueName(
        player, acb_hn, cueName);

    // 再生開始
    criAtomExPlayer_Start(player);
}

void DataManager::Update()
{
    if (libraryInitialized)
    {
        criAtomEx_ExecuteMain();
    }
}

CriAtomExPlayerStatus DataManager::GetStatus() const
{
    if (player == nullptr)
        return CRIATOMEXPLAYER_STATUS_ERROR;

    return criAtomExPlayer_GetStatus(player);
}

void DataManager::Finalize()
{
    // 作成したリソースを逆順に解放

    if (player != nullptr)
    {
        criAtomExPlayer_Destroy(player);
        player = nullptr;
    }

    if (voice_pool != nullptr)
    {
        criAtomExVoicePool_Free(voice_pool);
        voice_pool = nullptr;
    }

    if (acb_hn != nullptr)
    {
        criAtomExAcb_Release(acb_hn);
        acb_hn = nullptr;
    }

    if (acfRegistered)
    {
        criAtomEx_UnregisterAcf();
        acfRegistered = false;
    }

    if (libraryInitialized)
    {
        criAtomEx_Finalize_WASAPI();
        libraryInitialized = false;
    }
}
