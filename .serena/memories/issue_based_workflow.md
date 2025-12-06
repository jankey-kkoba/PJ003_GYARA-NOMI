# Issue ベース作業ワークフロー

## GitHub Project情報
- **プロジェクト名**: ギャラ飲みアプリ開発
- **プロジェクト番号**: 2
- **プロジェクトID**: PVT_kwHODTGhKs4BB5sL
- **オーナー**: jankey-kkoba
- **リポジトリ**: jankey-kkoba/PJ003_GYARA-NOMI

## 基本原則
- **すべてのタスクはIssueベースで進める**
- `/task`コマンドをスタートとして作業を開始する
- Context Auto Compact対策として、Issueにチェックリスト形式で作業計画を記載する

## ワークフロー

### 1. タスク取得（/taskコマンド）
```bash
# プロジェクトからタスク取得（プロジェクト番号: 2）
gh project item-list 2 --owner jankey-kkoba --format json | jq '[.items[] | select(.status == "Todo" or .status == "In Progress")]'
```

#### Statusフィールドの注意点
- `status`は`"Todo"`、`"In Progress"`、`"Done"`、`null`のいずれか
- Status="Todo"または"In Progress"のタスクが存在する場合、null（未設定）は表示しない

### 2. 作業計画の提示
- Issueの内容を確認し、実行計画を立てて**ユーザーに提示**
- ユーザーのOKを待つ（確認なしに作業開始しない）

### 3. IssueにTODOチェックリスト作成
- OKをもらったらIssueのTODOセクションに実行計画を記載
- `.github/ISSUE_TEMPLATE/feature_request.md`のフォーマットに従う
- 具体的なステップで記載（途中中断しても再開しやすくするため）

例:
```markdown
## 👨‍💻実装
 - [ ] 型定義: XxxType型を定義
 - [ ] サービス層: xxxメソッド追加
 - [ ] API層: エンドポイント追加
## 🧪テスト
 - [ ] integration/services: xxx.test.ts
 - [ ] integration/api: xxx.test.ts
```

### 4. 作業実行
- チェックリストの項目が完了したらIssueのチェックリストにチェックを入れる(Issueを更新する)
- Context Auto Compactが起きても再開できるようにする

### 5. チェックリスト更新時の確認（必須）
以下の順序で実行:

```bash
# 1. コードフォーマット
cd frontend && npm run format

# 2. 型チェック
cd frontend && npm run typecheck

# 3. リント
cd frontend && npm run lint
```

### 6. 作業の最後にテスト実行
```bash
# ブラウザ環境テスト
cd frontend && npm run test

# Node.js環境テスト（DB操作テスト）
cd frontend && npm run test:node
```

### 7. コミット
- コミットメッセージは日本語で作成
- Issue番号を含める（例: `feat: 機能追加 (ISSUE #XX)`）

## 8. 完了
- 作業が完了したら作業内容をコメントに残し、Closeする

## 作業を途中から始める場合
- Issueのコメントに進捗が書かれている場合もあるので新しいものから確認する

## DB変更時
```bash
cd frontend && npm run db:generate
```
- マイグレーションファイル名はkebab-caseでわかりやすい名称にする
- 例: `create-users-table`

## ビルド確認（必要に応じて）
```bash
cd frontend && npm run build
```
