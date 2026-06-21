# みなとみらいピッツァ - Power Apps Canvas App

**`MinatomiraiPizza.msapp`** が同梱されています。Power Apps Studio または `make.powerapps.com` でそのままインポートできる、ビルド済みのキャンバスアプリです。

## クイックスタート: そのままインポート

1. https://make.powerapps.com を開く
2. 左メニュー **アプリ** → **インポート** → **キャンバス アプリ**
3. `pac-source/MinatomiraiPizza.msapp` を選択 → インポート

または、Power Apps Studio で **ファイル → 開く → 参照** から `.msapp` を直接開けます。

## 同梱内容

### App.OnStart に組み込み済みのマスターデータ
| コレクション         | 件数 | 用途                            |
|----------------------|------|---------------------------------|
| `colStores`          | 8    | 店舗（みなとみらい21内 8 拠点）  |
| `colProducts`        | 20   | 商品（Pizza 8 / Side 4 / Drink 5 / Dessert 3）|
| `colSizes`           | 3    | ピザサイズ S/M/L                |
| `colCrusts`          | 4    | 生地（通常・薄・厚・グルテンフリー）|
| `colToppings`        | 8    | 追加トッピング                  |
| `colCoupons`         | 4    | 割引クーポン                    |
| `colDeliveryAreas`   | 8    | みなとみらい21の配達エリア      |
| `colPaymentMethods`  | 3    | 現金 / カード / PayPay          |
| `colDeliveryTimes`   | 4    | 配達時間スロット                |

合計 **62 件のマスターレコード**が App 起動時に自動で `ClearCollect` されます。

### 画面構成（4 画面、情報表示のみ）
- `StoreSelectScreen` — **8 店舗を一覧表示。最初に開く画面**。Studio で Button + `Set(varSelectedStore, ThisItem); Navigate(HomeScreen)` を組むと店舗選択 → メニューの遷移が完成
- `HomeScreen` — ブランド・人気商品・サイズ/生地/トッピング/配達エリア/クーポンの一覧
- `SizesScreen` — サイズ・生地・トッピングの詳細と追加料金
- `DeliveryScreen` — 配達エリア・お届け時間・支払い方法・クーポン詳細

> **注:** Power Platform CLI `pac canvas pack` の v1.34 系プレビュー版では、Gallery やインタラクティブな TextInput/Dropdown/Button などの **ウィジェット系コントロール**を含むソースを一発でパックすると `NullReferenceException` が出ることが多いため、本バンドルは **Label のみ（情報表示用）** で構成しています。
>
> **カート / カスタマイズ / 注文確定の対話的フロー**は、インポート後に Power Apps Studio 内で:
> 1. 既存の Gallery / TextInput / Dropdown / Button コントロールを画面に追加
> 2. `../powerapps/formulas.pfx` の Power Fx 式をコピペ
>
> という流れで構築してください。App.OnStart に全マスターデータがすでに読み込まれているため、コントロールの `Items` プロパティに `colProducts` 等を指定するだけで動きます。

## ソースから再ビルドする

### 1. Power Platform CLI を入れる
```bash
sudo apt-get install -y dotnet-sdk-8.0           # Linux
# brew install dotnet@8                           # macOS
# winget install Microsoft.DotNet.SDK.8           # Windows

dotnet tool install --global Microsoft.PowerApps.CLI.Tool --version 1.34.4
export PATH="$PATH:$HOME/.dotnet/tools"
```

### 2. パック実行
```bash
cd pac-source
./build.sh
# → MinatomiraiPizza.msapp が再生成
```

または手動で:
```bash
pac canvas pack --sources . --msapp ./MinatomiraiPizza.msapp
```

### 3. アンパック（編集して中身を確認したい場合）
```bash
pac canvas unpack --msapp MinatomiraiPizza.msapp --sources /tmp/unpacked
```

## ディレクトリ構造

```
pac-source/
├── MinatomiraiPizza.msapp        ← ビルド済みの完成ファイル（28KB）
├── CanvasManifest.json           ← アプリメタデータ・画面順序
├── ControlTemplates.json         ← 使用するコントロールテンプレートの定義
├── ComponentReferences.json
├── build.sh                      ← pac canvas pack のラッパー
├── README.md                     ← このファイル
├── Connections/                  ← データ接続（現状なし）
├── DataSources/                  ← 外部データソース（現状なし、全てローカル）
├── Entropy/                      ← pac 内部メタデータ
├── Other/                        ← misc files (Entropy, Templates 等)
├── Src/
│   ├── App.fx.yaml               ← OnStart に全マスターデータ
│   ├── HomeScreen.fx.yaml        ← ホーム画面
│   ├── SizesScreen.fx.yaml       ← サイズ・生地・トッピング画面
│   ├── DeliveryScreen.fx.yaml    ← 配達・支払い・クーポン画面
│   ├── Themes.json               ← デフォルトテーマ
│   └── EditorState/              ← 各コントロールの Studio エディタ状態
└── pkgs/                         ← コントロール widget XML 定義（label）
```

## トラブルシューティング

| 症状                              | 対処                                                                 |
|-----------------------------------|----------------------------------------------------------------------|
| `pac` not found                   | `dotnet tool install --global Microsoft.PowerApps.CLI.Tool --version 1.34.4` |
| pack 時に `Format is not supported` 警告 | `CanvasManifest.json` の `FormatVersion` をお使いの pac がサポートする値（現行は `"0.24"`）に合わせる |
| インポート時に「チェックサム不一致」警告 | 問題ありません（再パックしたファイルでは常に出ます。無視可）             |
| 起動時にコレクションが空           | App 選択 → 右クリック → "Run OnStart" を実行                          |
| Gallery / Button を追加したい      | インポート後 Power Apps Studio 内で追加。`../powerapps/formulas.pfx` 参照 |

## 関連ファイル
- `../powerapps/collections.pfx` — App.OnStart にコピペできる元コード
- `../powerapps/formulas.pfx` — カート・クーポン・注文確定の Power Fx サンプル
- `../powerapps/data/*.csv` — SharePoint / Excel データソース化用 CSV
- `../powerapps/data.json` — 全テーブル統合 JSON
