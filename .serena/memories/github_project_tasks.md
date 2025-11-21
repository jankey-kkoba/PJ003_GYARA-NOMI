# GitHub Projectタスク取得手順

## プロジェクト情報
- プロジェクト番号: 2
- オーナー: @me

## タスク取得時の注意点

### Statusフィールドの確認
- `status`フィールドは`"Todo"`、`"In Progress"`、`"Done"`、または`null`（未設定）のいずれか
- **重要**: Status="Todo"または"In Progress"のタスクが1件でも存在する場合、Status未設定（null）のタスクは表示しない

### 正しいフィルタリング手順
1. まずstatusフィールドの実際の値を確認する
2. `status == "Todo"` または `status == "In Progress"` のタスクを抽出
3. 上記が0件の場合のみ、`status == null` のタスクを表示

### コマンド例
```bash
# 全タスクのstatus確認
gh project item-list 2 --owner @me --format json | jq '.items[] | {number: .content.number, title: .title, status: .status, iteration: .iteration.title}'

# Todo/In Progressのみ抽出（現在イテレーション）
gh project item-list 2 --owner @me --format json | jq '[.items[] | select(.status == "Todo" or .status == "In Progress")]'
```

### よくある間違い
- JSONの`status`フィールドを確認せずに、すべてのタスクを"Todo"として表示してしまう
- `status: null`のタスクを"Todo"として扱ってしまう
