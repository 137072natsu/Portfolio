#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "CharacterMenuEntry.h"
#include "CharacterMenuPlayerController.generated.h"

class UCharacterMenuWidget;

/**
 * メニューの生成・終了とゲーム側の入力モードを管理するController。
 * Widget自身にはゲーム全体の操作方法を持たせない。
 *
 * ※ YOURPROJECT_API をプロジェクトの MODULE_API マクロに置き換える。
 */
UCLASS()
class YOURPROJECT_API ACharacterMenuPlayerController : public APlayerController
{
    GENERATED_BODY()

protected:
    // 今回は簡単な例として従来のInputComponentからMキーを登録する。
    virtual void SetupInputComponent() override;

    // BP_CharacterMenuPlayerController のClass Defaultsで設定する。
    UPROPERTY(EditDefaultsOnly, Category = "Character Menu")
    TSubclassOf<UCharacterMenuWidget> MenuWidgetClass;

    // エディタで入力できるキャラクター一覧。
    UPROPERTY(EditDefaultsOnly, Category = "Character Menu")
    TArray<FCharacterMenuEntry> CharacterEntries;

private:
    // 画面に表示中のWidgetをGCから保護するUPROPERTY。
    UPROPERTY(Transient)
    TObjectPtr<UCharacterMenuWidget> MenuWidget;

    void ToggleCharacterMenu();
    void OpenCharacterMenu();
    void HandleMenuClosed();
};
