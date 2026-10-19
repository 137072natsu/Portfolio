
#include "DataManager.h"

#include <cstdlib>
#include <cstdio>
#include <string>

namespace
{
    // CRI ADXが内部で使用するメモリ確保関数
    void* CriMalloc(void*, CriUint32 size)
    {
        return std::malloc(size);
    }

    // メモリ解放関数
    void CriFree(void*, void* memory)
    {
        std::free(memory);
    }

    // CRI ADXのエラーを表示
    void OnCriError(
        const CriChar8* errorId,
        CriUint32 p1,
        CriUint32 p2,
        CriUint32*)
    {
        const auto* message =
            criErr_ConvertIdToMessage(errorId, p1, p2);

        if (message)
        {
            std::fprintf(
                stderr, "[CRI ADX] %s\n", message);
        }
    }

    std::string CriPath(
        const std::filesystem::path& path)
    {
        return path.string();
    }
}

// デストラクタ
DataManager::~DataManager()
{
    Shutdown();
}

// =====================================
// ライブラリ初期化
// =====================================
bool DataManager::Initialize(
    const std::filesystem::path& acf)
{
    if (initialized_)
        return false;

    // ① エラーコールバック
    criErr_SetCallback(OnCriError);

    // ② メモリアロケーター登録
    criAtomEx_SetUserAllocator(
        CriMalloc, CriFree, nullptr);

    // ③ User PCM Outputの設定
    CriAtomExConfigForUserPcmOutput config{};

    criAtomEx_SetDefaultConfigForUserPcmOutput(
        &config);

    config.asr.output_sampling_rate = 48000;
    config.asr.output_channels = 2;

    // ④ CRI ADX初期化
    criAtomEx_InitializeForUserPcmOutput_PC(
        &config, nullptr, 0);

    initialized_ = true;

    // ⑤ ACF登録
    const std::string acfPath = CriPath(acf);

    if (criAtomEx_RegisterAcfFile(
        nullptr,
        acfPath.c_str(),
        nullptr,
        0) != CRI_TRUE)
    {
        Shutdown();
        return false;
    }

    acf_registered_ = true;

    // ⑥ D-BAS生成（ストリーミング対応）
    dbas_id_ = criAtomDbas_Create(
        nullptr, nullptr, 0);

    if (dbas_id_ == CRIATOMDBAS_ILLEGAL_ID)
    {
        Shutdown();
        return false;
    }

    // ⑦ Voice Pool設定
    CriAtomExStandardVoicePoolConfig vp{};

    criAtomExVoicePool_SetDefaultConfigForStandardVoicePool(
        &vp);

    vp.num_voices = 16;
    vp.is_streaming_only = CRI_FALSE;

    vp.player_config.streaming_flag = CRI_TRUE;
    vp.player_config.max_channels = 2;
    vp.player_config.max_sampling_rate = 96000;

    // ⑧ Voice Pool生成
    voice_pool_ =
        criAtomExVoicePool_AllocateStandardVoicePool(
            &vp, nullptr, 0);

    if (!voice_pool_)
    {
        Shutdown();
        return false;
    }

    // ⑨ Player生成
    player_ = criAtomExPlayer_Create(
        nullptr, nullptr, 0);

    if (!player_)
    {
        Shutdown();
        return false;
    }

    return true;
}

// =====================================
// ACB読み込み
// =====================================
bool DataManager::LoadAcb(
    const std::filesystem::path& acb,
    const std::filesystem::path& awb)
{
    ReleaseAcb();

    const std::string acbPath = CriPath(acb);

    const std::string awbPath =
        awb.empty() ? "" : CriPath(awb);

    acb_hn_ = criAtomExAcb_LoadAcbFile(
        nullptr,
        acbPath.c_str(),
        nullptr,
        awbPath.empty()
            ? nullptr : awbPath.c_str(),
        nullptr,
        0);

    return acb_hn_ != nullptr;
}

// =====================================
// ACB解放
// =====================================
void DataManager::ReleaseAcb()
{
    if (player_)
    {
        criAtomExPlayer_Stop(player_);
    }

    if (acb_hn_)
    {
        criAtomExAcb_Release(acb_hn_);
        acb_hn_ = nullptr;
    }
}

// =====================================
// Player・Voice Poolなどの解放
// PCM取得スレッドの実行中に呼び出す
// =====================================
void DataManager::ReleasePlaybackResources()
{
    ReleaseAcb();

    if (player_)
    {
        criAtomExPlayer_Destroy(player_);
        player_ = nullptr;
    }

    if (voice_pool_)
    {
        criAtomExVoicePool_Free(voice_pool_);
        voice_pool_ = nullptr;
    }

    if (dbas_id_ != CRIATOMDBAS_ILLEGAL_ID)
    {
        criAtomDbas_Destroy(dbas_id_);
        dbas_id_ = CRIATOMDBAS_ILLEGAL_ID;
    }

    if (acf_registered_)
    {
        criAtomEx_UnregisterAcf();
        acf_registered_ = false;
    }
}

// =====================================
// ライブラリ終了
// =====================================
void DataManager::FinalizeLibrary()
{
    if (initialized_)
    {
        criAtomEx_FinalizeForUserPcmOutput_PC();
        initialized_ = false;

        criErr_SetCallback(nullptr);
    }
}

// =====================================
// 一括終了
// PCM取得スレッドが存在しない状態で呼ぶ
// =====================================
void DataManager::Shutdown()
{
    ReleasePlaybackResources();
    FinalizeLibrary();
}
