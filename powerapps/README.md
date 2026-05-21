# PowerUps — Power Apps (`.msapp`) 版

Web版PowerUps（杭工事管理）をMicrosoft Power Apps（キャンバスアプリ）に
移植するためのソースと、ビルド済み `.msapp` ファイルです。

## ファイル構成

```
powerapps/
├── src/                         Power Apps 展開（ソース）形式
│   ├── App.fx.yaml              アプリ起動時のサンプルデータ投入
│   ├── CanvasManifest.json      アプリマニフェスト
│   ├── DataSources.json         Collections のスキーマ
│   ├── Header.json              バージョン情報
│   ├── Properties.json          アプリプロパティ
│   ├── PublishInfo.json         公開情報
│   ├── Themes.json              カラーテーマ
│   └── Screens/
│       ├── DashboardScreen.fx.yaml   ダッシュボード（KPI＋直近記録）
│       ├── ProjectsScreen.fx.yaml    案件一覧
│       ├── PilesScreen.fx.yaml       杭一覧（案件絞り込み）
│       ├── PileDetailScreen.fx.yaml  杭詳細＋施工記録ギャラリー
│       ├── RecordFormScreen.fx.yaml  施工記録入力フォーム
│       ├── LayoutScreen.fx.yaml      杭芯配置図（状態色分け）
│       └── ReportsScreen.fx.yaml     帳票出力
├── build/
│   └── PowerUps.msapp           ビルド済み (このスクリプトでZIP化)
├── pack.py                      src/ を .msapp にパックする Python スクリプト
└── README.md                    本ファイル
```

## .msapp の生成方法

### 方法A: 同梱の Python スクリプト（簡易版）

```bash
python3 pack.py
# → build/PowerUps.msapp が生成されます
```

これは src/ 配下を素朴にZIPで固めるだけのものです。Power Apps Studio が
要求する付随ファイル（Entropy/ や ControlsImage/ など）を完備していない
ため、**Power Apps Studio でそのまま開けない可能性があります**。

### 方法B: Microsoft 公式 CLI（推奨）

正規の `.msapp` を生成するには Microsoft Power Platform CLI を使用します:

```bash
# インストール (例: dotnet 経由)
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# パック
pac canvas pack --sources ./src --msapp ./build/PowerUps.msapp

# 既存 .msapp の解凍（参照用）
pac canvas unpack --msapp ./build/PowerUps.msapp --sources ./unpacked
```

詳細: https://learn.microsoft.com/power-platform/developer/cli/introduction

## Power Apps Studio へのインポート

1. https://make.powerapps.com にアクセス
2. 左メニュー「アプリ」→「インポート」→「キャンバスアプリ」
3. `build/PowerUps.msapp` をアップロード
4. ターゲット環境（テナント／開発／本番）を選択してインポート

## アプリ構成（運用フロー）

```
[App.fx.yaml の OnStart]
   ├─ サンプル案件 2件
   ├─ サンプル杭 32本
   ├─ サンプル施工記録 6件
   └─ varDeviationTolerance = 100mm  (杭芯許容ズレ)

DashboardScreen
   └─ KPI（案件数／杭本数／完了／許容超過）＋直近記録ギャラリー
        ↓
ProjectsScreen
   └─ 案件一覧（検索／詳細／編集）
        ↓
PilesScreen
   └─ 杭一覧（案件絞り込み／状態表示／ズレ表示）
        ↓
PileDetailScreen
   └─ 杭情報＋施工記録一覧
        ↓
RecordFormScreen
   └─ 施工記録入力（削孔・根固め・杭芯ズレ・鉛直度・電流値・ミルク量）
        合成ズレ・許容超過判定をリアルタイム算出

LayoutScreen      杭芯配置図（状態別色分け）
ReportsScreen     帳票出力（案件別CSV）
```

## データソース（Collections）

すべて Power Apps の Collection で実装（バックエンド不要）。
将来 Dataverse / SQL Server へ移行する場合は `App.fx.yaml` の
`ClearCollect` を `LoadData` / `Patch` に置き換えてください。

| Collection      | 主キー       | 概要 |
|-----------------|-------------|---------|
| `colProjects`   | ProjectId   | 案件マスタ |
| `colPiles`      | PileId      | 杭マスタ（案件に紐付け） |
| `colRecords`    | RecordId    | 施工記録（杭に紐付け） |
| `colPileTypes`  | (Value)     | 杭種マスタ |
| `colPileMethods`| (Value)     | 工法マスタ |
| `colStatusOptions` | Code     | 状態マスタ |

## 制約事項

- 現バージョンは端末ローカル（Collections）保存のため、複数ユーザー
  共有運用には Dataverse / SharePoint List / SQL への接続が必要です
- 写真添付・座標CSVインポート・PDF帳票出力は未実装（拡張ポイント）
- `pack.py` で生成した `.msapp` は Power Apps Studio で開けない可能性が
  あるため、本番運用では Microsoft 公式 CLI (`pac canvas pack`) を
  使用してください
