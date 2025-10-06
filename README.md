# Tonight? Policies Repo

このリポジトリは Tonight? の法務・サポート関連ドキュメントを保管します。

## ドキュメント構成

- `legal/master/legal_documents.yaml` — EN/JA のマスター原稿（単一ソース）
- `tool/generate_legal_docs.dart` — マスターからアプリ資産 & Web 生成物を出力するスクリプト
- `assets/legal/{en,ja}` — Flutter アプリで利用する Markdown
- `docs/legal/{en,ja}` — GitHub Pages 向け出力（Jekyll front matter 付き）

## 更新手順

1. マスター `legal/master/legal_documents.yaml` を編集
2. `dart pub get`
3. `dart run tool/generate_legal_docs.dart`
4. 生成物（`assets/legal`, `docs/legal`）をコミット

### 自動化
- GitHub Actions `legal-docs-consistency` で `dart run tool/generate_legal_docs.dart` を実行し、差分が残ればジョブを失敗させます。
- ローカルでも同じチェックを走らせたい場合は `ln -sf ../../scripts/hooks/pre-commit-legal-docs.sh .git/hooks/pre-commit` を設定してください。

## 開発メモ

- Dart 3.x 系で動作確認済み
- 依存関係: `yaml`
