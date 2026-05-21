# みなとみらいピッツァ - Power Platform CLI 用ソース一式

このディレクトリは Microsoft 公式の `pac canvas pack` コマンドで `.msapp` に変換できる、Power Apps Canvas App のソースバンドルです。

## 含まれるもの

- **5画面のキャンバスアプリ**
  - `HomeScreen` — メニュー一覧（カテゴリ絞り込み・検索・ギャラリー表示）
  - `CustomizeScreen` — ピザのカスタマイズ（サイズ・生地・トッピング・数量）
  - `CartScreen` — カート（増減・削除・クーポン適用・合計表示）
  - `CheckoutScreen` — お届け先・支払い・備考入力 → 注文確定
  - `ConfirmScreen` — 注文完了画面（注文番号・お届け予定・合計）
- **App.OnStart** に全マスターデータ（商品20件・サイズ・生地・トッピング・クーポン・配達エリア・支払い方法・配達時間スロット）を `ClearCollect` 済み

## 使い方

### 1. Power Platform CLI (`pac`) を入れる

```bash
# クロスプラットフォーム（.NET SDK が必要）
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# Windows
winget install Microsoft.PowerPlatformCLI
```

### 2. パックして `.msapp` を生成

```bash
./build.sh
# または手動で
pac canvas pack --sources . --msapp MinatomiraiPizza.msapp
```

成功すると `MinatomiraiPizza.msapp` が出力されます。

### 3. Power Apps にインポート

1. https://make.powerapps.com を開く
2. 左メニュー **アプリ** → **インポート** → **キャンバス アプリ**
3. 生成された `.msapp` ファイルを選択 → インポート完了

または、Power Apps Studio で **ファイル → 開く → 参照** から `.msapp` を直接開けます。

## ディレクトリ構造

```
pac-source/
├── CanvasManifest.json          ← アプリ全体メタデータ
├── build.sh                     ← パック実行スクリプト
├── README.md                    ← このファイル
└── Src/
    ├── App.fx.yaml              ← App コントロール（OnStart に全データ）
    ├── HomeScreen.fx.yaml
    ├── CustomizeScreen.fx.yaml
    ├── CartScreen.fx.yaml
    ├── CheckoutScreen.fx.yaml
    ├── ConfirmScreen.fx.yaml
    ├── Themes.json
    └── EditorState/
        ├── App.editorstate.json
        ├── HomeScreen.editorstate.json
        ├── CustomizeScreen.editorstate.json
        ├── CartScreen.editorstate.json
        ├── CheckoutScreen.editorstate.json
        └── ConfirmScreen.editorstate.json
```

## App.OnStart で生成されるコレクション

| コレクション         | 件数 | 用途                            |
|----------------------|------|---------------------------------|
| `colProducts`        | 20   | 商品マスター（Pizza/Side/Drink/Dessert） |
| `colSizes`           | 3    | ピザサイズ S/M/L                |
| `colCrusts`          | 4    | 生地の種類                      |
| `colToppings`        | 8    | 追加トッピング                  |
| `colCoupons`         | 4    | 割引クーポン                    |
| `colDeliveryAreas`   | 8    | みなとみらい21の配達エリア      |
| `colPaymentMethods`  | 3    | 現金 / カード / PayPay          |
| `colDeliveryTimes`   | 4    | 配達時間スロット                |
| `colCart`            | 0    | カート（実行時に追加）          |
| `colSelectedToppings`| 0    | カスタマイズ画面の選択トッピング |
| `colOrders`          | 0    | 注文履歴（ローカル）            |

## 注意事項

- `.msapp` の中身はバージョン依存のチェックサムを含むため、ファイル生成は必ず `pac canvas pack` 経由で行ってください（手動ZIP不可）
- `colOrders` をクラウドに永続化したい場合は、SharePoint リストまたは Dataverse テーブルを追加し、`CheckoutScreen.fx.yaml` の `SubmitButton.OnSelect` を `Patch()` に置き換えてください（スキーマは `../powerapps/README.md` 参照）
- パック時に `pac` が「FormatVersion 不一致」を警告した場合、`CanvasManifest.json` の `FormatVersion` をお使いの `pac` のサポート範囲（例：`1.336` 等）に書き換えてください

## トラブルシューティング

| 症状                          | 対処                                                                 |
|-------------------------------|----------------------------------------------------------------------|
| `pac` not found               | `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`         |
| pack 時に YAML エラー         | 該当 `.fx.yaml` の式中、`;` ではなく `;;` を使う必要がある場合あり    |
| 起動時にコレクションが空       | App を選択 → 右クリック → "Run OnStart" を実行                       |
| インポート時に DocVersion 警告 | 新しい Studio で開いて保存し直すと最新版にアップグレードされます      |
