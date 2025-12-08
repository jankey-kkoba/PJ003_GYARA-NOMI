In Progressのタスクから作業を再開する

# 前提
- 参考: 各ステータスフィールドのIDと名前
	- id: f75ad846 名前: Todo
	- id: 47fc9ee4 名前: In Progress
	- id: 98236657 名前: Done

# 手順
1. 以下のコマンドを実行して今週の月曜日の日付を取得する
```sh
date -v-monday +%Y-%m-%d
```
※ 自分で曜日計算をせず、必ずこのコマンドの結果を使用すること

2. 以下のコマンドを実行し、In Progressのタスクを取得する(:iterationStartDateを手順1で取得した日付に置き換える)
```sh
gh project item-list 2 --owner @me --format json --limit 100 --jq '.items[] | select(.iteration.startDate == ":iterationStartDate" and .status == "In Progress")'
```

3. 取得結果に応じて分岐
   - **0件の場合**: 「In Progressのタスクがありません。`/task`コマンドで新しいタスクを開始してください。」と表示して終了
   - **1件の場合**: 手順4へ進む
   - **複数件の場合**: 一覧を表示し、どのタスクを再開するか選択させてから手順4へ進む

4. 選択されたタスクのIssue番号を特定し、以下を実行
```sh
gh issue view <Issue番号> --repo jankey-kkoba/PJ003_GYARA-NOMI
```

5. Issueにコメントがある場合、最新のコメントを取得して進捗を確認
```sh
gh issue view <Issue番号> --repo jankey-kkoba/PJ003_GYARA-NOMI --comments
```

6. Issueの内容と進捗コメントを元に、作業を再開する
   - TODOチェックリストの状態を確認
   - 未完了のタスクから作業を継続
   - @.serena/memories/issue_based_workflow.md の内容を元に作業を進める
