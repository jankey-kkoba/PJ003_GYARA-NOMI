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

## MCPプロファイル管理

### フェーズ別MCPプロファイル
コンテキスト使用量を最適化するため、開発フェーズに応じてMCPを切り替える。

| フェーズ | コマンド | 有効なMCP | 推定tokens |
|---------|---------|----------|-----------|
| 計画・調査 | `/phase plan` | serena | ~13k |
| 実装 | `/phase impl` | serena, supabase-local, next-devtools | ~26k |
| リファクタリング | `/phase refactor` | serena, supabase-local, next-devtools | ~26k |
| テスト | `/phase test` | serena, supabase-local, next-devtools, playwright | ~43k |
| デプロイ | `/phase deploy` | serena, supabase, next-devtools, vercel, playwright | ~57k |

### フェーズ切り替えの流れ
1. `/task` でタスク取得時、タスク内容から適切なフェーズを推定
2. 現在のMCPプロファイルと異なる場合、`/phase [フェーズ]` を提案
3. `/phase` 実行時:
   - 現在の進捗をIssueに保存
   - MCPプロファイルを更新
   - Claude Code再起動を案内
4. 再起動後、`/task-restart` で作業を再開

### プロファイル設定ファイル
- プロファイル定義: `.claude/mcp-profiles/*.json`
- 有効化設定: `.claude/settings.local.json` の `enabledMcpjsonServers`

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

#### 既存機能の改修時の注意
- **既存機能を改修する場合、関連するテストはほぼ確実に失敗する**
- テストの修正を先に行ってから、動作確認に進むこと
- テストを修正せずに作業完了としないこと

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

### 6.1. UI/UXに影響するタスクの動作確認（必須）
UI/UXに影響するタスクの場合は、テスト実行後に以下の手順で動作確認を行う:

1. **Playwrightを起動して実際の動作を確認**
   - 自動テストだけでなく、実際のブラウザで目視確認を行う
   - レスポンシブ表示、アニメーション、UXなどテストで確認しにくい部分を重点的に確認

2. **作業者への確認依頼**
   - 一通りのテスト・動作確認が終わったら、作業者に確認を取る
   - 「動作確認を実施してよいか」の許可を得てから次に進む

3. **問題がなければ動作確認実施**
   - 作業者のOKをもらってから、最終的な動作確認を実施
   - 確認結果をIssueにコメントとして残す

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
