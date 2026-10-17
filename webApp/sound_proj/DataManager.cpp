#include "DataManager.h"

#include <Windows.h>
#include <cstdlib>
#include <filesystem>

namespace
{
    // CRIの内部ワーク領域向けの確保・解放関数
    void* CriMalloc(void* /*obj*/, CriUint32 size)
    {
        return std::malloc(size);
    }

    void CriFree(void* /*obj*/, void* memory)
    {
        std::free(memory);
    }

    // Visual Studioの「出力」ウィンドウへCRIエラーを出力する。
    void CriErrorCallback(const CriChar8* errorId,
                          CriUint32 p1,
                          CriUint32 p2,
                          CriUint32* /*pArray*/)
    {
        const CriChar8* message = criErr_ConvertIdToMessage(errorId, p1, p2);
        if (message != nullptr)
        {
            OutputDebugStringA("[CRI ADX] ");
            OutputDebugStringA(message);
            OutputDebugStringA("\n");
        }
    }
}

DataManager::~DataManager()
{
    Shutdown();
}

bool DataManager::Initialize(const char* acfPath, const char* acbPath,
                             const char* awbPath)
{
    if (atomInitialized_ || acfPath == nullptr || acbPath == nullptr)
        return false;

    // ① エラーコールバック・メモリアロケーター登録
    criErr_SetCallback(CriErrorCallback);
    criAtomEx_SetUserAllocator(CriMalloc, CriFree, nullptr);

    // ② CRI ADX全体の初期化（Windows / WASAPI）
    criAtomEx_Initialize_WASAPI(nullptr, nullptr, 0);
    atomInitialized_ = (criAtomEx_IsInitialized() == CRI_TRUE);
    if (!atomInitialized_)
        return false;

    // ③ ストリーミング再生時のみ D-BAS を生成
    const bool streaming = (awbPath != nullptr && awbPath[0] != '\0');
    if (streaming)
    {
        dbasId_ = criAtomDbas_Create(nullptr, nullptr, 0);
        if (dbasId_ == CRIATOMDBAS_ILLEGAL_ID)
        {
            Shutdown();
            return false;
        }
    }

    // ④ ACFファイルの登録
    if (criAtomEx_RegisterAcfFile(nullptr, acfPath, nullptr, 0) != CRI_TRUE)
    {
        Shutdown();
        return false;
    }
    acfRegistered_ = true;

    // ⑤ ACBファイルの読み込み（必要な場合はAWBも指定）
    acb_hn_ = criAtomExAcb_LoadAcbFile(
        nullptr, acbPath, nullptr, streaming ? awbPath : nullptr, nullptr, 0);
    if (acb_hn_ == nullptr)
    {
        Shutdown();
        return false;
    }

    // ⑥ 標準Voice Poolの作成
    // AWBありならストリーミング対応に設定する
    CriAtomExStandardVoicePoolConfig poolConfig{};
    criAtomExVoicePool_SetDefaultConfigForStandardVoicePool(&poolConfig);
    if (streaming)
        poolConfig.player_config.streaming_flag = CRI_TRUE;
    voice_pool_ = criAtomExVoicePool_AllocateStandardVoicePool(
        &poolConfig, nullptr, 0);
    if (voice_pool_ == nullptr)
    {
        Shutdown();
    // ⑧ キュー指定 → 再生
    criAtomExPlayer_SetCueName(player_, acb_hn_, cueName);
    const CriAtomExPlaybackId id = criAtomExPlayer_Start(player_);
    return id != CRIATOMEX_INVALID_PLAYBACK_ID;
}

void DataManager::Stop()
{
    if (player_ != nullptr)
        criAtomExPlayer_Stop(player_);
    if (captureActive_)
        CompleteCapture(true); // 手動停止時はそれまでの音声を保存
}

bool DataManager::StartCapture(const char* cueName, const std::string& wavPath)
{
    if (!player_ || !acb_hn_ || !cueName || !*cueName ||
        wavPath.empty() || captureActive_) return false;
    const auto status = criAtomExPlayer_GetStatus(player_);
    if (status == CRIATOMEXPLAYER_STATUS_PREP ||
        status == CRIATOMEXPLAYER_STATUS_PLAYING) return false;

    CriAtomExWaveformInfo info{};
    if (criAtomExAcb_GetWaveformInfoByName(acb_hn_, cueName, &info) != CRI_TRUE)
        return false;
    // Player PCM Callbackは単一波形のデコードデータを対象とする。
    if (!recorder_.Begin(info.sampling_rate, info.num_channels, 15))
        return false;

    savedWav_.clear();
    targetWav_ = wavPath;
    criAtomExPlayer_SetFilterCallback(player_, PcmRecorder::FilterCallback, &recorder_);
    criAtomExPlayer_SetCueName(player_, acb_hn_, cueName);
    if (criAtomExPlayer_Start(player_) == CRIATOMEX_INVALID_PLAYBACK_ID) {
        criAtomExPlayer_SetFilterCallback(player_, nullptr, nullptr);
        recorder_.Cancel();
        return false;
    }
    captureActive_ = true;
    return true;
}

void DataManager::CompleteCapture(bool save)
{
    if (!captureActive_) return;
    captureActive_ = false;
    criAtomExPlayer_SetFilterCallback(player_, nullptr, nullptr);
    recorder_.Cancel();
    if (save) {
        // ファイル書き込みはGUIスレッド。短時間の効果音を想定。
        // BGM等の大きな録音データなら別ワーカースレッドに渡す。
        if (recorder_.FinishToWav(targetWav_))
            savedWav_ = targetWav_;
    }
}

std::string DataManager::ConsumeSavedWav()
{
    std::string result = std::move(savedWav_);
    savedWav_.clear();
    return result;
}

void DataManager::Update()
{
    if (atomInitialized_)
        criAtomEx_ExecuteMain();
    if (captureActive_ && player_) {
        auto status = criAtomExPlayer_GetStatus(player_);
        if (recorder_.IsFull()) {
            criAtomExPlayer_Stop(player_);
            CompleteCapture(true);
        } else if (status == CRIATOMEXPLAYER_STATUS_PLAYEND) {
            CompleteCapture(true);
        } else if (status == CRIATOMEXPLAYER_STATUS_ERROR) {
            CompleteCapture(false);
        }
    }
}

CriAtomExPlayerStatus DataManager::GetStatus() const
{
    return (player_ != nullptr)
        ? criAtomExPlayer_GetStatus(player_)
        : CRIATOMEXPLAYER_STATUS_ERROR;
}

void DataManager::Shutdown()
{
    if (captureActive_) CompleteCapture(false);
    // 初期化とは逆の順序で破棄
    if (player_ != nullptr)
    {
        criAtomExPlayer_Destroy(player_);
        player_ = nullptr;
    }

    if (voice_pool_ != nullptr)
    {
        criAtomExVoicePool_Free(voice_pool_);
        voice_pool_ = nullptr;
    }

    if (acb_hn_ != nullptr)
    {
        criAtomExAcb_Release(acb_hn_);
        acb_hn_ = nullptr;
    }

    if (acfRegistered_)
    {
        criAtomEx_UnregisterAcf();
        acfRegistered_ = false;
    }

    if (dbasId_ != CRIATOMDBAS_ILLEGAL_ID)
    {
        criAtomDbas_Destroy(dbasId_);
        dbasId_ = CRIATOMDBAS_ILLEGAL_ID;
    }

    if (atomInitialized_)
    {
        criAtomEx_Finalize_WASAPI();
        atomInitialized_ = false;
    }
}
