# みなとみらいピッツァ / Minatomirai Pizza

横浜・みなとみらい21地区で使えるピザの注文Webアプリです。
静的なシングルページアプリ（HTML / CSS / バニラJS）で、サーバーや追加の依存関係なしで動きます。

## 主な機能

- **店舗選択（8店舗）**: みなとみらい本店・ランドマーク・パシフィコ・赤レンガ・馬車道・新高島・桜木町・コスモワールド店からボタンで選んで開始。選択した店舗は注文確定・履歴・確認画面にも反映
- **メニュー（20品以上）**: ピッツァ8種、サイド4種、ドリンク5種、デザート3種（店舗選択後に解放）
- **カテゴリタブ & 検索**: メニューを瞬時に絞り込み
- **ピッツァのカスタマイズ**: サイズ（S/M/L）、生地（通常/薄/厚/グルテンフリー）、追加トッピング（8種）
- **カート**: 追加・数量変更・削除、localStorageで永続化
- **クーポンコード**: `MM10` / `MIRAI20` / `LANDMARK` / `YOKOHAMA`
- **配達エリア限定**: ランドマークタワー、パシフィコ横浜、赤レンガ倉庫 など8エリア
- **お届け先・支払いフォーム**: 時間指定／現金・カード・PayPay対応
- **配達進捗ステッパー**: 注文完了後にご注文受付 → 焼成中 → 配達中 → お届け完了 をアニメーション表示
- **注文履歴**: 直近の注文を一覧表示（localStorage）
- **ダークモード**: トグル切替（OS設定にも追従）
- **レスポンシブ対応**: スマホ・タブレット・PC

## 使い方

依存関係はありません。`index.html` をブラウザで直接開くだけで動きます。

```bash
# 任意のローカルサーバーでも動きます
python3 -m http.server 8000
# → http://localhost:8000
```

## クーポン

| コード     | 内容                          | 利用条件         |
|------------|-------------------------------|------------------|
| `MM10`     | 10% OFF                       | 小計¥1,500以上   |
| `MIRAI20`  | 20% OFF                       | 小計¥3,000以上   |
| `LANDMARK` | ¥500 OFF                      | 小計¥2,000以上   |
| `YOKOHAMA` | ¥300 OFF                      | 小計¥1,500以上   |

## ファイル構成

- `index.html` — マークアップ
- `styles.css` — スタイル（ライト/ダーク両対応）
- `app.js` — メニュー描画・カート・カスタマイズ・クーポン・注文フロー・履歴
- `powerapps/` — Power Apps でそのまま使えるデータセット（CSV / JSON / Power Fx）

## Power Apps で使う

Power Apps への取り込み用に2セット用意しています。

### A. データのみほしい場合 → [`powerapps/`](powerapps/README.md)
- `powerapps/collections.pfx` を **App.OnStart** に貼り付け（colStores 含む）
- `powerapps/data/*.csv` を SharePoint / Excel データソースとしてインポート（`stores.csv` を含む 9 ファイル）
- `powerapps/data.json` で全テーブル1ファイル統合
- `powerapps/formulas.pfx` にカート・クーポン・注文確定のサンプル式

### B. `.msapp` をそのまま使いたい場合 → [`pac-source/`](pac-source/README.md)
**ビルド済みの `pac-source/MinatomiraiPizza.msapp` を同梱しています。** `make.powerapps.com` → アプリ → インポート から直接取り込めます。

```bash
# ソースから再ビルドする場合のみ
dotnet tool install --global Microsoft.PowerApps.CLI.Tool --version 1.34.4
cd pac-source && ./build.sh   # → MinatomiraiPizza.msapp 再生成
```

4 画面（StoreSelect / Home / Sizes / Delivery）と App.OnStart に colStores 含む全マスターデータを含みます。
# 南部市場エリア 出前アプリ（Power Apps 対応）

横浜市金沢区・南部市場駅周辺で使える出前アプリのPower Appsキャンバスアプリ一式です。

## 対象エリア
- 神奈川県横浜市金沢区 南部市場周辺
- 登録店舗: 12店舗・56メニュー

---

## ファイル構成

```
.
├── data/
│   ├── NanbuIchibaDelivery.xlsx   ← Power Appsにそのまま接続できるExcelファイル
│   ├── Categories.csv             ← カテゴリマスタ (8カテゴリ)
│   ├── Stores.csv                 ← 店舗マスタ (12店舗)
│   ├── MenuItems.csv              ← メニューマスタ (56品)
│   ├── Orders.csv                 ← 注文テーブル (サンプル6件)
│   └── OrderItems.csv             ← 注文明細テーブル
├── powerapps/
│   ├── App.fx.yaml                ← アプリ設定・データソース定義
│   ├── DataSchema.json            ← テーブル定義・リレーション仕様
│   └── Src/
│       ├── HomeScreen.fx.yaml         ← ホーム画面（カテゴリ選択・人気店）
│       ├── StoreListScreen.fx.yaml    ← 店舗一覧（絞り込み・ソート）
│       ├── MenuScreen.fx.yaml         ← メニュー・カート追加
│       ├── CartScreen.fx.yaml         ← カート確認・数量変更
│       ├── OrderConfirmScreen.fx.yaml ← 配達先入力・注文確定
│       ├── OrderCompleteScreen.fx.yaml← 注文完了
│       └── OrderHistoryScreen.fx.yaml ← 注文履歴
└── app/
    └── convert_to_excel.py        ← CSV→Excelワークブック変換スクリプト
```

---

## Power Appsへの取り込み手順

### Step 1: Excelファイルをアップロード

1. `data/NanbuIchibaDelivery.xlsx` を **OneDrive for Business** または **SharePoint** にアップロード

### Step 2: Power Apps Studio でアプリを作成

1. [make.powerapps.com](https://make.powerapps.com) を開く
2. **作成** → **キャンバスアプリ（電話レイアウト）**

### Step 3: データソースを接続

1. 左メニュー → **データ** → **データの追加**
2. **Excel Online (Business)** を選択
3. アップロードした `NanbuIchibaDelivery.xlsx` を選択
4. 以下のテーブルをすべてチェックして接続:
   - `categories_table`
   - `stores_table`
   - `menu_items_table`
   - `orders_table`
   - `order_items_table`

### Step 4: 画面を構築

`powerapps/Src/` フォルダのYAMLファイルを参照して、各画面のコントロールを配置してください。

| YAMLファイル | 画面 | 主な機能 |
|---|---|---|
| `HomeScreen.fx.yaml` | ホーム | カテゴリグリッド・人気店一覧 |
| `StoreListScreen.fx.yaml` | 店舗一覧 | 絞り込み・評価/配達時間/送料順ソート |
| `MenuScreen.fx.yaml` | メニュー | メニュー一覧・カートへ追加 |
| `CartScreen.fx.yaml` | カート | 数量変更・削除・最低注文金額チェック |
| `OrderConfirmScreen.fx.yaml` | 注文確認 | 配達先入力・支払方法・Excelへ保存 |
| `OrderCompleteScreen.fx.yaml` | 注文完了 | 注文番号・配達予定時間表示 |
| `OrderHistoryScreen.fx.yaml` | 注文履歴 | 過去注文一覧・ステータス表示 |

---

## アプリ機能一覧

- カテゴリ別・テキスト検索で店舗を絞り込み
- 評価順・配達時間順・送料順でソート
- 人気バッジ・おすすめ表示
- カートの数量増減・削除・合計自動計算
- 最低注文金額バリデーション
- 配達先・電話番号・支払方法入力
- 備考欄（アレルギー情報など）
- 注文確定でExcelテーブルに自動保存
- 注文履歴・ステータス確認（注文受付→準備中→配達中→完了）

---

## データ更新方法

新しい店舗・メニューを追加する場合:

```bash
# CSVを編集後、Excelを再生成
pip install openpyxl
python app/convert_to_excel.py
# NanbuIchibaDelivery.xlsx を OneDrive/SharePoint に上書き保存
```

---

## 登録店舗一覧

| 店舗名 | カテゴリ | 最短配達 | 最低注文 | 送料 |
|---|---|---|---|---|
| 南部市場 海鮮直送 魚清 | 海鮮・寿司 | 25分 | 1,000円 | 200円 |
| 南部市場食堂 なんぶ亭 | 定食・弁当 | 20分 | 800円 | 150円 |
| 横浜金沢ラーメン 波濤 | ラーメン | 30分 | 700円 | 200円 |
| 焼肉 金沢苑 | 焼肉・BBQ | 35分 | 2,000円 | 300円 |
| 中華料理 福満楼 | 中華料理 | 25分 | 800円 | 200円 |
| カフェ&ダイニング シーサイド | 洋食・カフェ | 30分 | 1,000円 | 200円 |
| 天ぷら処 金沢 | 天ぷら・揚げ物 | 25分 | 900円 | 150円 |
| 海鮮丼 みなみ | 海鮮・寿司 | 20分 | 1,200円 | 無料 |
| とんかつ 金澤屋 | 定食・弁当 | 30分 | 900円 | 200円 |
| 横浜家系 八景家 | ラーメン | 25分 | 600円 | 150円 |
| インド料理 スパイス南部 | その他 | 35分 | 800円 | 200円 |
| 鮮魚居酒屋 磯風 | 海鮮・寿司 | 30分 | 1,500円 | 250円 |
