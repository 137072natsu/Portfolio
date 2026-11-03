# Unreal Engine 5 C++ キャラクター選択メニュー

## 収録ファイル

| ファイル | 役割 |
|---|---|
| `CharacterMenuEntry.h` | キャラクターのID・表示名を表す構造体。`.cpp` は不要 |
| `CharacterRowWidget.h/.cpp` | 1行分の選択ボタン、クリック通知 |
| `CharacterMenuWidget.h/.cpp` | 一覧生成・選択名表示・FadeIn/FadeOut |
| `CharacterMenuPlayerController.h/.cpp` | Mキーによる開閉、Widget生成、入力管理 |
| `BuildCs_AddUMG.txt` | Build.csへのUMG依存関係の追加例 |

## 導入手順

1. `.h` と `.cpp` をプロジェクトの `Source/<プロジェクト名>/` 下（またはそのサブフォルダ）に配置する。
2. **すべての `YOURPROJECT_API`** をプロジェクトモジュールのAPIマクロ（例: `MYGAME_API`）に置き換える。プロジェクト名とは完全一致しない場合があるので既存のC++クラスを参照すること。
3. `<プロジェクト名>.Build.cs` の依存モジュールに `UMG` を追加する。`BuildCs_AddUMG.txt` を参考にする。
4. Visual Studioでビルドする（エディタ上のLive Codingで反映できないUCLASS変更は通常ビルド推奨）。
5. `CharacterRowWidget` を親とする Widget Blueprint `WBP_CharacterRow` を作る。
6. `CharacterMenuWidget` を親とする Widget Blueprint `WBP_CharacterMenu` を作る。
7. `CharacterMenuPlayerController` を親とする `BP_CharacterMenuPlayerController` を作り、GameModeのPlayer Controller Classに指定する。

## WBP_CharacterRowのWidget階層例

```text
SizeBox（Height Override: 52 など）
└── Button  [SelectButton]       ← Is Variable
    └── HorizontalBox
        ├── TextBlock [CharacterNameText]  ← Is Variable
        └── Image（任意）
```

`SelectButton` / `CharacterNameText` は `BindWidget` 対象なので、**名前と型を正確に一致**させる。

## WBP_CharacterMenuのWidget階層例

```text
CanvasPanel
└── Border [WindowPanel]          ← Is Variable
    └── VerticalBox
        ├── TextBlock [SelectedCharacterText] ← Is Variable、大きなフォント
        ├── SizeBox（Height Override: 350 など）
        │   └── ScrollBox
        │       └── VerticalBox [CharacterListBox] ← Is Variable
        └── Button [CloseButton] ← Is Variable
```

`ScrollBox` の内部に `VerticalBox` を置くことで、行が画面外に続いても一覧部分をスクロールできる。各行はC++の `RebuildCharacterList()` が動的生成するため、手動配置は不要。

**Class Defaults** で `RowWidgetClass` に `WBP_CharacterRow` を設定する。

## FadeIn・FadeOut

WBP_CharacterMenu の Animations パネルに**完全一致する名前**で以下2つを作成し、`WindowPanel` の `Render Opacity` をキーフレーム登録する。

| Animation | 0.0秒 | 0.3秒 |
|---|---:|---:|
| FadeIn | 0.0 | 1.0 |
| FadeOut | 1.0 | 0.0 |

FadeOutが終了すると `RemoveFromParent()` を実行する。Tweenの途中で閉じるとopacityが一瞬変わる可能性があるため、より滑らかにする場合は1本のアニメーションの正逆再生に発展させる。

## BP_CharacterMenuPlayerControllerの設定

- `MenuWidgetClass` : `WBP_CharacterMenu`
- `CharacterEntries` : 任意の要素を追加（例: `Id=char_01`, `Name=キャラクター01`）
- 使用するGameModeのPlayer Controller Classを `BP_CharacterMenuPlayerController` に設定する。

起動後、Mキーで表示・閉鎖。行クリックで上部のタイトルが変化し、Closeボタンでも閉じられる。

## 設計上のポイント

- **責務分離**: 行Widgetはクリック通知のみ、親Widgetが選択表示、Controllerが起動と入力管理を担当。
- **イベント駆動**: `Tick()` 不要。`OnClicked`とアニメーション完了イベントで駆動。
- **データと見た目の分離**: `FCharacterMenuEntry`を配列で渡し、UIは動的生成。
- **GC対策**: Controllerの`MenuWidget`を`UPROPERTY(Transient)`で保持し、FadeOut完了後に参照を解放。
- **連打対策**: `bClosing`によりFadeOut中の重複リクエストを無視。

## 注意事項

- このコードは**既存プロジェクトへ追加するためのソース**であり、Unreal Engineが必要。ここではUEエディタ上での実ビルドまでは検証していない。
- InputComponentの古典的な`BindKey`を利用した例。Enhanced Input採用の場合、Input Action経由で`ToggleCharacterMenu`を呼ぶ設計へ変更できる。
- 現在の入力モード復元はGameOnlyを仮定。別のUIが同時にある場合は、UI全体の入力管理を別途設計する。
- 数十件程度のリストを想定。数千件の場合は行Widgetを再利用できる`UListView`が適切。
- Widget Blueprintの変数やアニメーションが未設定の場合、バインド失敗やクラッシュの原因になる。README記載の名前・型を厳守する。
