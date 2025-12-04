今実行すべきタスクは何かをgithubから取得し、提案する
# 前提
- 本日の日付を含むIterationが作成してある
- 本日の日付を含むIterationにタスクが1件以上存在する
- 週の考え方は月曜始まりとする 「今週の初日」は本日の日付を含む週の月曜日とする
	- 例: 今日の日付が2025年11月23日(日)の場合の「今週月曜日」は2025年11月17日(月)です
- 参考: 各ステータスフィールドのIDと名前
	- id: f75ad846 名前: Todo
	- id: 47fc9ee4 名前: In Progress
	- id: 98236657 名前: Done
# 手順
1. 今週の初日の日付を取得し、以降のコマンド実行の際に使用する(:iterationStartDateをyyyy-mm-dd形式で置き換える)
2. 以下のコマンドを実行し、タスクを取得する 1件以上取得できたら手順3をスキップし、手順4へ進む
```sh
gh project item-list 2 --owner @me --format json --limit 100 --jq '.items[] | select(.iteration.startDate == ":iterationStartDate" and (.status == "Todo" or .status == "In Progress"))'
```
3. 手順2で取得件数が0件の場合、以下を実行する
```sh
gh project item-list 2 --owner @me --format json --limit 100 --jq '.items[] | select(.iteration.startDate == ":iterationStartDate" and .status == null)'
```
4. 手順2または3で取得できたタスクに対し、どれから手をつけるべきか判断し、提案する
5. ＊元のStatusがIn Progressだった場合はこの手順はスキップ 提案に対し、着手すべきタスクが決まったら、そのタスクのidを指定し以下のコマンドでステータスをIn Progressに変更する
```sh
gh project item-edit --project-id PVT_kwHODTGhKs4BB5sL --format json --id <item-id> --field-id PVTSSF_lAHODTGhKs4BB5sLzg0RQoA --single-select-option-id 47fc9ee4
```
6. タスクに着手する