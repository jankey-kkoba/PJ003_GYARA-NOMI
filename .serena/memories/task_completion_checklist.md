# タスク完了時のチェックリスト

## 必須確認事項

### 1. リント
```bash
cd frontend && npm run lint
```

### 2. テスト実行
```bash
# ブラウザ環境テスト
cd frontend && npm run npm run test
```
```bash
# Node.js環境テスト
cd frontend && npm run npm run test:node
```

### 3. ビルド確認
```bash
cd frontend && npm run build
```

### 4. 型チェック
- TypeScriptエラーがないことを確認

## DB変更時
```bash
cd frontend && npm run db:generate
```
- マイグレーションファイル名はkebab-caseでわかりやすい名称にする
- 例: `create-users-table`

## コミット前
- lint-stagedによる自動ESLint修正が実行される
- コミットメッセージは日本語で作成
