
#pragma once

#include <cri_xpt.h>
#include <cri_atom_ex.h>
#include <cri_atom_wasapi.h>

class DataManager
{
public:
    DataManager() = default;
    ~DataManager();

    // コピー禁止（CRIのハンドルを二重解放しないため）
    DataManager(const DataManager&) = delete;
    DataManager& operator=(const DataManager&) = delete;

    bool Initialize(const char* acfPath,
                    const char* acbPath);

    void PlayCue(const char* cueName);
    void Update();
    CriAtomExPlayerStatus GetStatus() const;
    void Finalize();

private:
    // 初期状態は無効なハンドル
    CriAtomExPlayerHn player = nullptr;
    CriAtomExVoicePoolHn voice_pool = nullptr;
    CriAtomExAcbHn acb_hn = nullptr;

    bool libraryInitialized = false;
    bool acfRegistered = false;
};
