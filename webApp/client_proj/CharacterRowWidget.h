#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "CharacterMenuEntry.h"
#include "CharacterRowWidget.generated.h"

class UButton;
class UTextBlock;

/**
 * キャラクター1人分の横長選択ボタン。
 * クリックを親に通知するだけで、選択後の処理は親に任せる。
 *
 * ※ YOURPROJECT_API をプロジェクトの MODULE_API マクロに置き換える。
 */
UCLASS(Abstract, Blueprintable)
class YOURPROJECT_API UCharacterRowWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    // 「どのキャラクターが選択されたか」を親Widgetへ知らせるC++デリゲート。
    DECLARE_MULTICAST_DELEGATE_OneParam(
        FOnCharacterSelected,
        const FCharacterMenuEntry&
    );

    FOnCharacterSelected OnCharacterSelected;

    // 作成した行Widgetへ表示データを渡す。
    void SetEntry(const FCharacterMenuEntry& InEntry);

protected:
    // 初期化時に一度だけクリックイベントを登録する。
    virtual void NativeOnInitialized() override;

    // WBP_CharacterRow の同名Widgetと連携する。
    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UButton> SelectButton;

    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UTextBlock> CharacterNameText;

private:
    // Button::OnClicked と紐付けるため、UFUNCTION にする。
    UFUNCTION()
    void HandleClicked();

    // この行が扱うキャラクター情報（値として保持）。
    FCharacterMenuEntry Entry;
};
