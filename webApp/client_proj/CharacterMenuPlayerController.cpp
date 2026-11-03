#include "CharacterMenuPlayerController.h"

#include "CharacterMenuWidget.h"
#include "Components/InputComponent.h"
#include "InputCoreTypes.h"

void ACharacterMenuPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();

    // Mキーでメニューを開閉する。
    // Enhanced Inputを採用しているプロジェクトなら、
    // この登録部分をInput Actionのバインドに置き換えてよい。
    InputComponent->BindKey(
        EKeys::M,
        IE_Pressed,
        this,
        &ACharacterMenuPlayerController::ToggleCharacterMenu
    );
}

void ACharacterMenuPlayerController::ToggleCharacterMenu()
{
    if (IsValid(MenuWidget))
    {
        // 表示中なら閉じる（即座に消さずFadeOutする）。
        MenuWidget->RequestClose();
    }
    else
    {
        // 未表示なら新しいメニューを生成する。
        OpenCharacterMenu();
    }
}

void ACharacterMenuPlayerController::OpenCharacterMenu()
{
    // BPクラス未設定や二重起動を防止する。
    if (!MenuWidgetClass || IsValid(MenuWidget))
    {
        return;
    }

    // このPlayerControllerをOwningPlayerにしたメニューWidgetを生成。
    MenuWidget = CreateWidget<UCharacterMenuWidget>(
        this,
        MenuWidgetClass
    );

    if (!MenuWidget)
    {
        return;
    }

    // Controllerが持っているキャラクターデータを渡す。
    MenuWidget->SetCharacters(CharacterEntries);

    // FadeOut後に通知されるので、入力モードを元に戻す。
    MenuWidget->OnMenuClosed.AddUObject(
        this,
        &ACharacterMenuPlayerController::HandleMenuClosed
    );

    // Viewportへ追加するとWidgetのNativeConstructが実行され、
    // 行の生成とFadeInが開始される。
    MenuWidget->AddToViewport();

    // UIクリックもゲーム側のキー入力も扱えるモード。
    FInputModeGameAndUI InputMode;
    InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
    InputMode.SetHideCursorDuringCapture(false);
    SetInputMode(InputMode);

    // ボタンをクリックできるようにカーソルを表示。
    bShowMouseCursor = true;
}

void ACharacterMenuPlayerController::HandleMenuClosed()
{
    // Widgetが閉じたので、所有参照を解放する。
    MenuWidget = nullptr;

    // このサンプルでは、起動前がGameOnlyだったと仮定する。
    // 他UIと共存する場合は、元の入力状態を管理・復元する仕組みにする。
    SetInputMode(FInputModeGameOnly());
    bShowMouseCursor = false;
}
