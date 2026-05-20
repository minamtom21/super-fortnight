# Power Apps 用データ / Power Apps-ready Dataset

みなとみらいピッツァのマスターデータを Power Apps でそのまま使える形にまとめたものです。
お好みの方法でご利用ください。

## 含まれるテーブル

| 名前              | 内容                                  | 件数 |
|-------------------|---------------------------------------|------|
| Products          | ピザ・サイド・ドリンク・デザート      | 20   |
| Sizes             | ピザサイズ（S / M / L）               | 3    |
| Crusts            | 生地の種類（通常/薄/厚/グルテンフリー）| 4    |
| Toppings          | 追加トッピング                        | 8    |
| Coupons           | 割引クーポン                          | 4    |
| DeliveryAreas     | 配達可能エリア（みなとみらい21）      | 8    |
| PaymentMethods    | 支払い方法                            | 3    |
| DeliveryTimes     | 配達希望時間スロット                  | 4    |

## 使い方は3通り

### 方法A：Power Fx をそのまま貼る（最速・データソース不要）

1. Power Apps Studio で対象アプリを開く
2. ツリー左上の **App** を選択
3. プロパティを **OnStart** に切り替える
4. `collections.pfx` の中身を全て貼り付けて保存
5. 一度 **App** を右クリック → **Run OnStart** で実行

→ `colProducts` `colCrusts` `colToppings` `colCoupons` `colDeliveryAreas` `colPaymentMethods` `colDeliveryTimes` `colSizes` が即座に使えるようになります。
バインド例：

- ギャラリーの **Items**：`colProducts`（ピザだけなら `Filter(colProducts, Category = "Pizza")`）
- サイズの **Items**：`colSizes`
- エリアの **Items**：`colDeliveryAreas`
- 合計ラベル：`"¥" & Text(Sum(colCart, LineTotal), "[$-ja-JP]#,##0")`

カートへの追加・クーポン適用・注文確定のサンプル Power Fx は `formulas.pfx` に同梱しています。

### 方法B：CSV を SharePoint / Excel にインポート

`data/` に各テーブルの CSV を置いています。

#### SharePoint リストとして
1. SharePoint サイトで **新規 → リスト → CSV から**
2. 該当の CSV をアップロード（UTF-8 のためそのまま日本語OK）
3. Power Apps から **データの追加 → SharePoint** で接続

#### Excel テーブルとして
1. Excel で CSV を開き、範囲を **テーブルとして書式設定**（テーブル名を `Products` などに）
2. 同名で保存し、OneDrive へアップロード
3. Power Apps から **データの追加 → OneDrive for Business → ファイル選択 → テーブル選択**

### 方法C：JSON を直接読み込む

`data.json` に全テーブルを1ファイルでまとめています。
ParseJSON を使えばクラウドフロー（Power Automate）や Power Apps から取り込めます。

```powerfx
// 例：data.json を Power Automate でHTTP取得→Apps に返す
Set(varData, ParseJSON(yourFlowOutput));
ClearCollect(colProducts, ForAll(Table(varData.products), ...));
```

## ファイル一覧

```
powerapps/
├── README.md           ← このファイル
├── collections.pfx     ← App.OnStart に貼り付ける Power Fx
├── formulas.pfx        ← 追加・更新・合計・注文確定のサンプル式
├── data.json           ← 全テーブル統合 JSON
└── data/
    ├── products.csv
    ├── sizes.csv
    ├── crusts.csv
    ├── toppings.csv
    ├── coupons.csv
    ├── delivery_areas.csv
    ├── payment_methods.csv
    └── delivery_times.csv
```

## データスキーマ

### Products
| 列          | 型        | 説明                                    |
|-------------|-----------|----------------------------------------|
| ProductID   | Text (PK) | 一意ID                                  |
| Category    | Text      | `Pizza` / `Side` / `Drink` / `Dessert` |
| Name        | Text      | 商品名（日本語）                        |
| Emoji       | Text      | 絵文字アイコン                          |
| Description | Text      | 説明文                                  |
| PriceS      | Number    | Sサイズ価格（Pizza以外は0）             |
| PriceM      | Number    | Mサイズ価格（Pizza以外は0）             |
| PriceL      | Number    | Lサイズ価格（Pizza以外は0）             |
| Price       | Number    | 単一価格（Pizza以外で使用）             |
| Tag         | Text      | 任意のバッジ（例：`定番` `人気` `限定`）|

### Crusts / Toppings
| 列                  | 型        | 説明        |
|---------------------|-----------|-------------|
| CrustID / ToppingID | Text (PK) | 一意ID      |
| Name                | Text      | 表示名      |
| ExtraPrice          | Number    | 追加料金（円）|

### Coupons
| 列            | 型      | 説明                              |
|---------------|---------|-----------------------------------|
| Code          | Text PK | クーポンコード（大文字想定）       |
| DiscountType  | Text    | `Percent` または `Flat`           |
| Value         | Number  | 値（%またはJPY）                  |
| MinSubtotal   | Number  | 適用に必要な最低小計（円）         |
| Label         | Text    | UI 表示用のラベル                  |

### DeliveryAreas / PaymentMethods / DeliveryTimes / Sizes
それぞれ ID / 表示名 / 補助情報のシンプルな構成です。CSV のヘッダ参照。

## 注文データの保存先（任意）

注文履歴を残す場合は、以下スキーマで SharePoint リスト or Dataverse テーブルを作るのがおすすめです。

| 列            | 型        |
|---------------|-----------|
| OrderNumber   | Text      |
| PlacedAt      | DateTime  |
| CustomerName  | Text      |
| Phone         | Text      |
| Area          | Text      |
| Address       | Text      |
| DeliveryTime  | Text      |
| Payment       | Text      |
| Note          | Text Multi|
| Items         | Text Multi (JSON 文字列) |
| Subtotal      | Number    |
| CouponCode    | Text      |
| Discount      | Number    |
| Total         | Number    |

`formulas.pfx` の「6) Place order」セクションを Patch() に置き換えると、そのまま書き込めます。
