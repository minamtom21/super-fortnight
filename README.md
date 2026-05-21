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
