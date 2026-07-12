# NAOSU Power Apps版

PR #3 の是正写真管理Webアプリを、Power Appsキャンバスアプリとして再構成するソースです。

## 画面
- ホーム
- 新規是正登録
- 対応中一覧
- 完了保管庫

## 現在の保存方式
動作確認用としてPower Appsコレクションを使用します。
本運用ではSharePointリストおよびドキュメントライブラリへの接続を推奨します。

## ビルド
GitHub Actions `Build NAOSU msapp` が `NAOSU.msapp` を生成します。
