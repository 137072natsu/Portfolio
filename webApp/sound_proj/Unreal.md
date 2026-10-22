Unreal Engineの標準オーディオ機能で、CRI ADXの criAtomExPlayer_Create() に相当する処理を実装するなら、UAudioComponent を使うのが基本です。

CRI ADXとの対応は次のようになります。
CRI ADX	Unreal Engine C++
criAtomExPlayer_Create()	UAudioComponent の生成
criAtomExPlayer_SetCueId()	SetSound()
criAtomExPlayer_Start()	Play()
criAtomExPlayer_Stop()	Stop()
criAtomExPlayer_Destroy()	Componentの破棄・GCによる管理

① 最もシンプルな方法
あらかじめ用意した音声ファイル（Sound Waveなど）を再生するなら、次のように書けます。
#include "Kismet/GameplayStatics.h"
#include "Components/AudioComponent.h"

// 音声プレイヤーを作成
UAudioComponent* Player =
    UGameplayStatics::CreateSound2D(this, SoundAsset);

// 再生開始
if (Player)
{
    Player->Play();
}


SoundAsset は USoundBase* 型で、Unreal EngineにインポートしたWAVなどの音声アセットを参照します。

CreateSound2D() は再生前のAudioComponentを生成し、Play() で再生を開始します。

Epic Developer Community



② CRI ADXのように生成・設定・再生を分ける方法
例えばActor内でAudioComponentを管理するなら、次のように実装できます。
// 音声プレイヤーを作成
UAudioComponent* Player =
    NewObject<UAudioComponent>(this);

// コンポーネントを登録
Player->bAutoActivate = false;
Player->RegisterComponent();

// 音声データを設定
Player->SetSound(SoundAsset);

// 再生
Player->Play();

// 停止
Player->Stop();


このようにすれば、CRI ADXの以下の処理と近い構造になります。
// CRI ADX
CriAtomExPlayerHn player =
    criAtomExPlayer_Create(NULL, NULL, 0);

criAtomExPlayer_SetCueId(player, acb, cueId);

criAtomExPlayer_Start(player);


なお、Unreal側ではプレイヤーを継続して使う場合、UPROPERTY() の付いたメンバー変数としてAudioComponentを保持することをおすすめします。

Epic Developer Community
+1



③ もっと簡単に再生するなら
プレイヤーを保持する必要がなく、一度だけ音を鳴らすなら、
UGameplayStatics::PlaySound2D(this, SoundAsset);


これだけでも再生できます。ただし、こちらはFire-and-Forget方式で、再生用のAudioComponentは返されません。

Epic Developer Community



注意：WAVファイルを直接再生したい場合
ここまでのコードは、基本的にUnreal Engineへインポートした音声アセットを使用する方法です。

もし今回やりたいことが、CRI ADXのようにC++で音声プレイヤーを生成し、外部のWAVファイルやメモリ上のPCMデータを渡して直接再生することであれば、別のアプローチが必要です。

その場合は USoundWaveProcedural などを使う方法が候補になります。

特にCRI ADXのPCMデータ取得処理と組み合わせたいのであれば、こちらの方法が重要になります。
















CriWareUnrealEngineってやつでやりたい












1m 28s考えました







CRIWARE for Unreal Engine を使用するなら、criAtomExPlayer_Create() に近い役割を持つのは UAtomComponent です。

CRIWAREプラグインには音声再生用のC++ APIが用意されているので、Unreal Engine標準の UAudioComponent を使用する必要はありません。
① 最も簡単な再生方法
CRIWARE for Unreal Engine V2の場合は、次のように書けます。
#include "AtomGameplayStatics.h"
#include "AtomComponent.h"
#include "AtomSoundBase.h"

// AtomComponentを生成し、音声を再生
UAtomComponent* Player =
    UAtomGameplayStatics::SpawnSound2D(
        this,
        SoundAsset
    );


SoundAsset は UAtomSoundBase* 型の音声アセットです。Atom Sound Cueなどを指定します。

SpawnSound2D() は、内部で UAtomComponent を生成し、自動的に音声再生を開始します。

CRIWARE
+1




再生後に停止したい場合は、
if (IsValid(Player))
{
    Player->Stop();
}


これで停止できます。

ただし、SpawnSound2D() はデフォルトでは再生終了後にコンポーネントを自動破棄します。継続的にプレイヤーを管理するなら、次の方法がおすすめです。
② criAtomExPlayer_Create() に近い実装
プレイヤーの生成、音声設定、再生を分けたいなら、NewObject<UAtomComponent>() を使用します。

次は AActor を継承したクラスの中で実行する例です。

MyAtomActor.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MyAtomActor.generated.h"

class UAtomComponent;
class UAtomSoundBase;

UCLASS()
class AMyAtomActor : public AActor
{
    GENERATED_BODY()

public:
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, Category = "Audio")
    TObjectPtr<UAtomSoundBase> SoundAsset;

private:
    UPROPERTY()
    TObjectPtr<UAtomComponent> Player;
};


MyAtomActor.cpp
#include "MyAtomActor.h"
#include "Atom/AtomComponent.h"
#include "Atom/AtomSoundBase.h"

void AMyAtomActor::BeginPlay()
{
    Super::BeginPlay();

    if (!IsValid(SoundAsset))
    {
        return;
    }

    // ① 音声プレイヤーを生成
    Player = NewObject<UAtomComponent>(this);

    // 登録時の自動再生を無効化
    Player->bAutoActivate = false;

    // Unrealのコンポーネントとして登録
    AddInstanceComponent(Player);
    Player->RegisterComponent();

    // ② 音声データを設定
    Player->SetSound(SoundAsset);

    // ③ 音量を設定
    Player->SetVolumeMultiplier(1.0f);

    // ④ 音声再生
    Player->Play();
}


この実装はCRIWARE V2公式マニュアルの NewObject、コンポーネント登録、SetSound、Play の手順をActor用に構成したものです。

CRIWARE




CRI ADX Nativeと比較すると、
CRI ADX Native	CRIWARE Unreal
criAtomExPlayer_Create()	NewObject<UAtomComponent>()
criAtomExPlayer_SetCueId()	SetSound()
criAtomExPlayer_SetVolume()	SetVolumeMultiplier()
criAtomExPlayer_Start()	Play()
criAtomExPlayer_Stop()	Stop()

となります。
③ Build.csの設定
CRIWARE V2でC++からAPIを呼び出すには、プロジェクトの .Build.cs に CriWareCore を追加します。
PublicDependencyModuleNames.AddRange(
    new string[]
    {
        "Core",
        "CoreUObject",
        "Engine",
        "InputCore",
        "CriWareCore"
    }
);


これはV2の公式手順にも記載されています。

CRIWARE



④ CRIWAREのバージョンに注意
CRIWARE for Unreal EngineにはV1とV2があり、APIが一部異なります。
	V1	V2
Module	CriWareRuntime	CriWareCore
再生用クラス	UAtomComponent	UAtomComponent
再生補助API	UAtomStatics	UAtomGameplayStatics
キューの型	USoundAtomCue	UAtomSoundCue

公式ドキュメント
- CRIWARE V2：C++による音声再生
- CRIWARE V1：C++ビルド手順
ひとつ確認したいのですが、使用しているのは CRIWARE for Unreal Engine V1とV2のどちらでしょうか？

これが分かれば、使っているバージョンに合わせてコードを正確に揃えられます。
