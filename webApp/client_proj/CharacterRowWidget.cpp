#include "CharacterRowWidget.h"

#include "Components/Button.h"
#include "Components/TextBlock.h"

void UCharacterRowWidget::NativeOnInitialized()
{
    Super::NativeOnInitialized();

    // 行のボタンがクリックされたら HandleClicked を呼ぶ。
    // NativeOnInitialized は基本的に一度だけ呼ばれるため、
    // NativeConstruct で何度も登録するのを避けられる。
    SelectButton->OnClicked.AddDynamic(
        this,
        &UCharacterRowWidget::HandleClicked
    );
}

void UCharacterRowWidget::SetEntry(const FCharacterMenuEntry& InEntry)
{
    // この行が担当するキャラクター情報を保存。
    Entry = InEntry;

    // Blueprint側のTextBlockに表示名を設定する。
    CharacterNameText->SetText(Entry.Name);
}

void UCharacterRowWidget::HandleClicked()
{
    // 子Widget自身はタイトル変更を行わない。
    // 親Widgetに「選択されたキャラクター」を通知する。
    OnCharacterSelected.Broadcast(Entry);
}
