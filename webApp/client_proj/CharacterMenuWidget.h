#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "CharacterMenuEntry.h"
#include "CharacterMenuWidget.generated.h"

class UBorder;
class UButton;
class UTextBlock;
class UVerticalBox;
class UWidgetAnimation;
class UCharacterRowWidget;

/**
 * キャラクター選択メニューの本体。
 * 担当: 一覧生成 / 選択名の更新 / FadeIn・FadeOut / 閉鎖通知。
 *
 * ※ YOURPROJECT_API をプロジェクトの MODULE_API マクロに置き換える。
 */
UCLASS(Abstract, Blueprintable)
class YOURPROJECT_API UCharacterMenuWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    // FadeOutが終了し、ウィンドウが閉じられたことを外部へ通知する。
    DECLARE_MULTICAST_DELEGATE(FOnMenuClosed);
    FOnMenuClosed OnMenuClosed;

    // 表示するキャラクター一覧を受け取る。
    void SetCharacters(TArray<FCharacterMenuEntry> InCharacters);

    // 即座には消さず、FadeOut開始を要求する。
    void RequestClose();

protected:
    // イベント登録は一回だけ行う。
    virtual void NativeOnInitialized() override;

    // Viewportへ表示された際の準備・FadeInを行う。
    virtual void NativeConstruct() override;

    // WBP_CharacterMenu で同名に設定する必要があるWidget群。
    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UVerticalBox> CharacterListBox;

    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UTextBlock> SelectedCharacterText;

    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UButton> CloseButton;

    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UBorder> WindowPanel;

    // WBP_CharacterMenu のAnimationsパネルで同名のAnimationを作る。
    UPROPERTY(Transient, meta = (BindWidgetAnim))
    TObjectPtr<UWidgetAnimation> FadeIn;

    UPROPERTY(Transient, meta = (BindWidgetAnim))
    TObjectPtr<UWidgetAnimation> FadeOut;

    // Class Defaultsで WBP_CharacterRow を指定する。
    UPROPERTY(EditDefaultsOnly, Category = "Character Menu")
    TSubclassOf<UCharacterRowWidget> RowWidgetClass;

private:
    // 画面に表示するキャラクターのデータ。
    TArray<FCharacterMenuEntry> Characters;

    // 二重にFadeOutを始めないためのフラグ。
    bool bClosing = false;

    // CharacterListBoxにキャラクターの行を作り直す。
    void RebuildCharacterList();

    // 行Widgetからの選択通知を受け取る。
    void HandleCharacterSelected(const FCharacterMenuEntry& SelectedEntry);

    UFUNCTION()
    void HandleCloseClicked();

    // Animation終了デリゲートから呼び出されるためUFUNCTIONが必要。
    UFUNCTION()
    void HandleFadeOutFinished();
};
