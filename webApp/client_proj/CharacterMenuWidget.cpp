#include "CharacterMenuWidget.h"

#include "CharacterRowWidget.h"
#include "Animation/WidgetAnimation.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"

void UCharacterMenuWidget::NativeOnInitialized()
{
    Super::NativeOnInitialized();

    // 閉じるボタンのクリック時に RequestClose へ進む。
    CloseButton->OnClicked.AddDynamic(
        this,
        &UCharacterMenuWidget::HandleCloseClicked
    );

    // FadeOutの再生が「完了」したときに呼ばれるイベントを登録。
    // Tickや時間指定タイマーを使わず、アニメーション完了を待てる。
    FWidgetAnimationDynamicEvent FinishedEvent;
    FinishedEvent.BindDynamic(
        this,
        &UCharacterMenuWidget::HandleFadeOutFinished
    );
    BindToAnimationFinished(FadeOut, FinishedEvent);
}

void UCharacterMenuWidget::NativeConstruct()
{
    Super::NativeConstruct();

    // 新たに表示したウィンドウは閉鎖処理を行っていない状態。
    bClosing = false;

    // 何も選択されていないときの見出しを表示。
    SelectedCharacterText->SetText(
        NSLOCTEXT("CharacterMenu", "SelectPrompt", "キャラクターを選択")
    );

    // 受け取っているデータから一覧を構築。
    RebuildCharacterList();

    // Widget Blueprintに設定したフェードインを再生。
    PlayAnimation(FadeIn);
}

void UCharacterMenuWidget::SetCharacters(
    TArray<FCharacterMenuEntry> InCharacters)
{
    // 引数を値で受け、配列の中身をムーブして余分なコピーを抑える。
    Characters = MoveTemp(InCharacters);

    // すでに画面に表示されていれば、その場で一覧を更新する。
    // 初回はController側でAddToViewportしたときに構築される。
    if (IsInViewport())
    {
        RebuildCharacterList();
    }
}

void UCharacterMenuWidget::RebuildCharacterList()
{
    // 再構築で同じ行を重複追加しないように既存の子を消す。
    CharacterListBox->ClearChildren();

    // Blueprintで行Widgetクラスが未指定なら、ログを出して終了。
    if (!RowWidgetClass)
    {
        UE_LOG(LogTemp, Warning,
            TEXT("CharacterMenuWidget: RowWidgetClass is not set."));
        return;
    }

    // データ1件につき行Widgetを1つ生成する。
    for (const FCharacterMenuEntry& Entry : Characters)
    {
        UCharacterRowWidget* Row = CreateWidget<UCharacterRowWidget>(
            GetOwningPlayer(),
            RowWidgetClass
        );

        if (!Row)
        {
            continue;
        }

        // 新しい行に、このキャラクターのID・表示名を渡す。
        Row->SetEntry(Entry);

        // 子からの選択通知を、親のメソッドへつなぐ。
        Row->OnCharacterSelected.AddUObject(
            this,
            &UCharacterMenuWidget::HandleCharacterSelected
        );

        // 行Widgetを縦方向のコンテナへ追加。
        UVerticalBoxSlot* Slot = CharacterListBox->AddChildToVerticalBox(Row);
        if (Slot)
        {
            // 行と行の間隔を8px程度空ける。
            Slot->SetPadding(FMargin(0.f, 0.f, 0.f, 8.f));
        }
    }
}

void UCharacterMenuWidget::HandleCharacterSelected(
    const FCharacterMenuEntry& SelectedEntry)
{
    // FadeOut中にクリックされてもタイトルを変更しない。
    if (bClosing)
    {
        return;
    }

    // 選択したキャラクター名を上部の大きな文字へ反映。
    SelectedCharacterText->SetText(SelectedEntry.Name);

    // 動作確認用ログ。必要ならここからゲーム側へ選択イベントを通知する。
    UE_LOG(LogTemp, Log,
        TEXT("Character selected: %s"),
        *SelectedEntry.Id.ToString());
}

void UCharacterMenuWidget::HandleCloseClicked()
{
    // ボタン操作も外部からの操作も同じメソッドへまとめる。
    RequestClose();
}

void UCharacterMenuWidget::RequestClose()
{
    // FadeOut中に二度押しされても処理を重複させない。
    if (bClosing)
    {
        return;
    }
    bClosing = true;

    // 閉じる演出中は、ウィンドウ内のボタンを押せないようにする。
    WindowPanel->SetVisibility(ESlateVisibility::HitTestInvisible);

    // 表示アニメーションがまだ動いていれば止める。
    if (IsAnimationPlaying(FadeIn))
    {
        StopAnimation(FadeIn);
    }

    // ここではRemoveFromParentを行わず、FadeOutを再生する。
    PlayAnimation(FadeOut);
}

void UCharacterMenuWidget::HandleFadeOutFinished()
{
    if (!bClosing)
    {
        return;
    }

    // FadeOutの最後まで見せてから画面から取り除く。
    RemoveFromParent();

    // Controllerに終了を知らせ、入力モードをゲームへ戻してもらう。
    OnMenuClosed.Broadcast();
}
