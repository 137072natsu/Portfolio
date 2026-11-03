#pragma once

#include "CoreMinimal.h"
#include "CharacterMenuEntry.generated.h"

/**
 * キャラクター選択メニューで使用するデータ。
 * UIの実装クラスに依存させず、表示情報だけを持たせる。
 *
 * ※ USTRUCT なので、この型だけの .cpp は不要。
 */
USTRUCT(BlueprintType)
struct FCharacterMenuEntry
{
    GENERATED_BODY()

    // 内部的な識別子。表示名が変わっても同じキャラクターを識別できる。
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Character")
    FName Id = NAME_None;

    // 画面に表示する名前。FText を使うことで多言語対応しやすくする。
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Character")
    FText Name;
};
