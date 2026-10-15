#pragma once

// CRI SDKのヘッダーは cri_xpt.h から読み込む
#include <cri_xpt.h>
#include <cri_atom_ex.h>
#include <cri_atom_wasapi.h>

// このサンプルではアプリケーション全体で1インスタンスだけ生成する
class DataManager final
{
public:
    DataManager() = default;
    ~DataManager();

    DataManager(const DataManager&) = delete;
    DataManager& operator=(const DataManager&) = delete;

    // ACFとACBを読み込み、Voice PoolとPlayerを作成
    // awbPath == nullptr: ACB内メモリ再生
    // awbPath != nullptr: 外部AWBを伴うストリーミング再生にも対応
    bool Initialize(const char* acfPath, const char* acbPath,
                    const char* awbPath = nullptr);

    // キュー名を指定して再生。すでに再生中なら重複再生しない。
    bool PlayCue(const char* cueName);
    void Stop();
    void Update();  // GUIのタイマーから定期的に呼ぶ
    CriAtomExPlayerStatus GetStatus() const;
    bool IsReady() const { return player_ != nullptr; }

    void Shutdown();

private:
    CriAtomExPlayerHn player_ = nullptr;
    CriAtomExVoicePoolHn voice_pool_ = nullptr;
    CriAtomExAcbHn acb_hn_ = nullptr;
    CriAtomDbasId dbasId_ = CRIATOMDBAS_ILLEGAL_ID;
    bool atomInitialized_ = false;
    bool acfRegistered_ = false;

};
