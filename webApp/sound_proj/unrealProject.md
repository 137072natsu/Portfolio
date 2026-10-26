Unreal EngineにCRIWAREを導入するなら、公式の「CRIWARE Unreal Engine Plugin」をダウンロードして、プロジェクトの Plugins フォルダに配置する方法が簡単です。

以前使用していたUnreal Engine 5.6.1を想定して説明します。
① CRIWAREプラグインをダウンロードする









CRI ADX LE 公式ダウンロードページ

無償版のCRI ADXを使用できます。UE5向けSDKも配布されています。



公式サイトで確認できる対応状況は次のとおりです。
項目	内容
SDK	ADX LE UE SDK 2.05.01
対応UE	UE 5.4〜5.7
対応OS	Windows / macOS など
開発環境	Visual Studio 2022
ライセンス	無償版（利用条件あり）

UE5.6.1は対応対象に含まれています。

CRIWARE for Games
+1




ダウンロード画面では、ADX LE UE SDK (2.05.01) を選択してください。Native SDKやUnity SDKとは別です。
② Unrealプロジェクトへプラグインを配置する
まずUnreal Editorを終了してください。

ダウンロードしたZIPを解凍すると、CRIWARE SDK内に次のディレクトリがあります。
cri/
└── UnrealEngine/
    └── Engine/
        └── Plugins/
            └── ...


この Plugins フォルダを丸ごとUnrealプロジェクトのルートディレクトリへコピーします。

配置後のイメージです。
MyUnrealProject/
├── Binaries/
├── Config/
├── Content/
├── Plugins/          ← CRIWAREプラグイン
│   └── ...
├── Source/
└── MyUnrealProject.uproject


これは公式マニュアルでも案内されているプロジェクト単位の導入方法です。

CRIWARE Game



③ Unreal Engineを起動する
1. MyUnrealProject.uproject をダブルクリックする。
2. モジュールの再ビルドを要求されたら「はい」を選択する。
3. Unreal Editorが起動したら、編集 → プラグイン を開く。
4. CRI または Atom で検索し、導入したプラグインが認識・有効化されているか確認する。
正常に認識されれば導入完了です。

もし could not be compiled や Missing Modules が出た場合は、UEとプラグインのバイナリのバージョン違いなどが考えられます。Visual StudioからC++プロジェクトを再ビルドする方法が公式に案内されています。

CRIWARE Game



④ Unreal C++からCRIWAREを呼び出す
プラグイン導入後、C++から UAtomComponent を使用できるようにします。

まず YourProject.Build.cs にモジュールを追加してください。
PrivateDependencyModuleNames.AddRange(
    new string[]
    {
        "CriWareCore"
    }
);


これはCRIWAREプラグインv2系のモジュール名です。v1系の CriWareRuntime とは異なるため注意してください。

Zenn
+1




音声を再生する最小限の例は次のようになります。
#include "Atom/AtomComponent.h"
#include "Atom/AtomSoundBase.h"

// AtomComponentを生成
UAtomComponent* Player =
    NewObject<UAtomComponent>(this);

// コンポーネントを登録
Player->bAutoActivate = false;
Player->RegisterComponent();

// 音声キューを設定
Player->SetSound(AtomSound);

// 音声を再生
Player->Play();


ここで AtomSound は UAtomSoundBase* 型の音声アセット参照です。継続利用する場合は Player をActorの UPROPERTY() メンバーとして保持してください。

CRI ADXとの対応関係は次のようになります。
CRI ADXネイティブAPI	Unreal C++
criAtomExPlayer_Create()	NewObject<UAtomComponent>()
criAtomExPlayer_SetCueId()	SetSound()
criAtomExPlayer_Start()	Play()
criAtomExPlayer_Stop()	Stop()

この対応は概念上のもので、UAtomComponent がネイティブの CriAtomExPlayerHn と完全に同じものという意味ではありません。

CRIWARE Game



⑤ 音声データを読み込む
音を鳴らすには、CRI Atom Craftで作成したADX音声データをUnrealにインポートする必要があります。
ファイル	役割
.acf	Atom全体の設定
.acb	キューシートと音声情報
.awb	ストリーミング用の波形データ

インポート後、編集 → プロジェクト設定 → CriWare → ADX Atom でAtom Configを設定します。.awb を使う場合はAtom Cue Sheet側への関連付けも必要です。

CRIWARE Game




公式の一連の手順は ADXクイックスタート に掲載されています。

なお、以前使用していた criAtomExPlayer_Create() などのネイティブAPIをUnreal C++内から直接呼びたい場合は、UAtomComponent を利用する方法とは別に、SDKのヘッダー、リンク設定、初期化状態の確認が必要になります。

まずはプラグインv2を導入し、UAtomComponent で音声が再生できる状態まで作るのがおすすめです。
















ランタイムとは？













ランタイム（Runtime）とは、プログラムを実行するときに必要となる仕組みや、そのプログラムが実際に動作している環境のことです。

Unreal EngineやCRIWAREでは、特に「ゲーム実行中に機能を動かすためのライブラリやモジュール」という意味で使われます。
① ランタイムとエディタの違い
Unreal Engineでは、大きく2つに分けられます。
種類	役割	具体例
Editor	ゲームを開発・編集する	マテリアル作成、音声アセット設定
Runtime	ゲームの実行中に処理する	音声再生、描画、物理演算、AI処理

例えば、CRIWAREなら次のようになります。
Editor（開発時）

CRI Atomの音声アセットをインポート・設定する


Runtime（実行時）

ゲーム中にCRI ADXを使って音声を再生・停止・制御する


② Unreal C++におけるRuntime
Unrealプラグインには、例えば次のようなモジュールがあります。
MyPlugin/
├── Source/
│   ├── MyPluginRuntime/
│   │   ├── Public/
│   │   └── Private/
│   │
│   └── MyPluginEditor/
│       ├── Public/
│       └── Private/


.uplugin ファイルでモジュールの種類を指定できます。
{
    "Modules": [
        {
            "Name": "MyPluginRuntime",
            "Type": "Runtime",
            "LoadingPhase": "Default"
        },
        {
            "Name": "MyPluginEditor",
            "Type": "Editor",
            "LoadingPhase": "Default"
        }
    ]
}


- Runtime：ゲーム実行時にも使用するモジュール。パッケージ化したゲームにも組み込める。
- Editor：Unreal Editorで使用するモジュール。通常、製品版ゲームには含めない。
③ CRIWAREの場合
先ほどの criAtomExPlayer_Create() を例にすると、
CriAtomExPlayerHn player =
    criAtomExPlayer_Create(NULL, NULL, 0);


このコードで呼び出しているのは、CRI ADXのランタイムライブラリが提供する関数です。

実行時には、CRI ADXのランタイムが音声プレイヤーの生成や音声デコード、再生制御などを担当します。

ただし、criAtomExPlayer_Create() が呼び出された瞬間だけランタイムが存在するわけではありません。ゲームの動作中、必要な音声処理を継続的に行う仕組みがランタイムです。

つまり、

Editor = ゲームを作るための仕組み

Runtime = 作ったゲームを動かすための仕組み

という理解で大丈夫です。

ちなみに、CRIWAREの CriWareRuntime という名前はUnreal用プラグインのモジュール名として使われることがありますが、これは「ランタイム」という一般概念とは区別して考えてください。
















EngineModules is out of date.と出たのだが












1m 2s考えました







Engine Modules is out of date は、Unreal Engineが読み込もうとしているモジュールのビルド状態が、現在のエンジン環境と一致していないときに表示されるエラーです。

CRIWAREプラグインを導入した直後であれば、プラグインの再コンパイルが必要になっている可能性が高いです。

Epic Gamesも、古いバージョンのUnrealで作成されたプラグインを追加した際に同様のエラーが発生する事例を報告しています。

Unreal Engine



① まず試してほしい解決方法
Unreal Engine 5.6.1、Visual Studio 2022を想定します。
1. Unreal Editorを完全に終了する。
2. プロジェクトの .uproject ファイルを右クリックする。
3. 「Generate Visual Studio project files」を選択する（Windows 11では「その他のオプションを確認」の中にある場合があります）。
4. 生成・更新された .sln ファイルをVisual Studioで開く。
5. ビルド構成を次のように設定する。
構成

Development Editor


プラットフォーム

Win64（x64）


6. ソリューションエクスプローラーで自分のゲームプロジェクトを右クリックし、「ビルド」を実行する。
7. ビルドが成功したら .uproject から再起動する。
この方法で、プロジェクトに含まれるCRIWAREモジュールを現在のUnreal環境向けにコンパイルできます。

Epic Developer Community



② それでも直らない場合
一度、古いビルドの生成物を消して作り直します。
MyProject/
├── Binaries/           ← 削除対象
├── Intermediate/       ← 削除対象
├── Content/
├── Plugins/
│   └── ...             ← CRIWAREプラグイン
├── Source/
└── MyProject.uproject


UnrealとVisual Studioを終了した状態で、プロジェクト直下の Binaries と Intermediate を削除し、①の手順で再生成・再ビルドしてください。

ただし、Plugins 以下やUnreal Engine本体の Binaries は、ここでは削除しないでください。 プラグインがソースコードを含んでいない場合、ビルド済みバイナリを失うと復旧できないことがあります。
③ CRIWAREのバージョンを確認する
CRIWAREでは、もう1点重要な注意があります。

公式マニュアルでは現在v2.6.1のリリースが案内されています。また、v2.6.0の AtomInsights はUE5.7固有のモジュールを利用しているため、UE5.6では AtomInsightsLegacy を使うよう案内されています。

CRIWARE Game




そのため、UE5.6.1なら以下も確認してください。
- 使用しているCRIWAREプラグインがUE5.6対応版か
- AtomInsights が有効になっていないか
- 必要なら AtomInsightsLegacy に切り替えられるか
また、CRIWARE公式の導入ガイドでは、新規プロジェクトはC++プロジェクトとして作成するよう案内しています。

CRIWARE Game



④ 解決しない場合に確認するログ
Visual Studioでビルドに失敗したら、「出力」ウィンドウの最初の error を確認してください。
MyProject/
└── Saved/
    └── Logs/
        └── MyProject.log


または、
C:\Users\<ユーザー名>\AppData\Local\
    UnrealBuildTool\Log.txt


に詳細が記録されている場合があります。

確認したいのは次の2点です。
1. CRIWAREプラグインのバージョン（2.05.01、2.6.1など）
2. Engine Modules are out of date の前後に表示されているエラーメッセージ全文
この2つが分かれば、単純な再ビルドで直る問題なのか、CRIWAREプラグインの互換性による問題なのか、かなり絞り込めます。
















This project does not have any source code. You need to add C++ source files to the project from the Editor before you can generate project files.












33s考えました







このエラーは、現在のUnreal EngineプロジェクトにC++のソースコードが存在しないため、Visual Studioのプロジェクトファイルを生成できないという意味です。

おそらく、現在のプロジェクトは Blueprint Only（ブループリント専用） として作成されています。

CRIWARE公式のUE5導入チュートリアルでも、C++プロジェクトを使用するよう案内されています。

CRIWARE Game



解決方法①：Unreal Editorが起動できる場合
一番簡単な方法です。
1. Unreal Editorでプロジェクトを開く。
2. 上部メニューの Tools（ツール）→ New C++ Class（新規C++クラス） を選択する。
3. 親クラスに Actor を選択する。
4. クラス名を MyAudioPlayer などに設定する。
5. 「Create Class」を押す。
これでプロジェクトにC++ソースコードが追加されます。
MyProject/
├── Content/
├── Plugins/
├── Source/                 ← 新しく作成される
│   └── MyProject/
│       ├── MyAudioPlayer.h
│       ├── MyAudioPlayer.cpp
│       └── MyProject.Build.cs
└── MyProject.uproject


C++クラスを追加すると、Blueprint OnlyプロジェクトをC++プロジェクトとして扱えるようになります。

Epic Developer Community Forums




その後、Unreal Editorを閉じてから以下を実行します。
1. .uproject を右クリック
2. Generate Visual Studio project files
3. .sln をVisual Studioで開く
4. Development Editor / Win64 でビルド
解決方法②：CRIWAREのエラーでUnreal Editorが起動できない場合
今回はこちらの可能性が高そうです。

この場合は、一時的にCRIWAREプラグインを外してからC++クラスを追加します。

手順
1. プロジェクト全体をバックアップする。
2. Unreal Editorを終了する。
3. MyProject/Plugins 内のCRIWAREプラグインを、プロジェクトの外へ一時的に移動する。
4. 必要なら .uproject をテキストエディタで開き、CRIWAREに対応するプラグイン項目の "Enabled" を false に変更する。
5. .uproject を起動する。
6. Tools → New C++ Class からC++クラスを追加する。
7. Unreal Editorを閉じ、CRIWAREプラグインを元の場所へ戻す。
8. .uproject で無効化した設定を元に戻す。
9. Visual Studioのプロジェクトファイルを再生成してビルドする。
これでCRIWAREも含めてビルドできるようになる可能性があります。

CRIWAREの公式マニュアルにも、Blueprintプロジェクトでモジュール互換性エラーが発生する場合は、C++プロジェクトでプラグインをビルドする対処方法が紹介されています。

CRIWARE Game




ただし、プラグイン自体がUE5.6.1に対応していなかったり、ビルドに必要なソースが含まれていなかったりする場合は、別途対応が必要です。

ひとつ確認したいことがあります。

現在、CRIWAREプラグインを追加したUnrealプロジェクトは、次のどちらの状態でしょうか？

Unreal Editorは起動できる

Engine Modules is out of date と表示され、起動できない

この状態での手順を確認
