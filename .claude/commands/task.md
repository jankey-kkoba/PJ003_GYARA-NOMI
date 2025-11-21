# 前提
- タスクを取得する際はプロジェクト番号:2、オーナー:自分(@me)で取得すること
- 取得する際はjsonで取得し、-qや--jqなどでフィルタリングする(使い方はここを参照 https://jqlang.org/manual/)
# 手順
1. 以下の優先度に従い、プロジェクトアイテム(Issue)を取得する
- 以下の通りイテレーション内にタスクがないか検索
	- 今日を含むイテレーションが存在すれば今日のイテレーションからタスクを検索
		- イテレーションが存在しない場合、今週(月曜始まりとして考える)の月曜日から日曜日までのイテレーションを作成
	- 今日を含むイテレーションが存在しない、または存在してもイテレーション内にタスクがない場合、未来のイテレーションからタスクを検索
	- 未来のイテレーションが存在しない、または存在してもイテレーション内にタスクがない場合、バックログ(イテレーションを持たないタスク)を検索
- さらに、Statusフィールドでフィルタリングする（この順で優先）:
	1. Status="Todo"または"In Progress"のタスクのみを抽出して表示
	2. 上記が0件の場合のみ、Statusが未設定のタスクを表示
	- **重要**: Status="Todo"/"In Progress"のタスクが1件でも存在する場合、Status未設定のタスクは表示しないこと
2. 取得したイシューのリストを提示する際、必ずStatusフィールドの値も表示すること
3. どれから手をつけるべきか判断し、提案する
4. 提案に対し、着手すべきタスクが決まったら、そのタスクのステータスをIn Progressに変更し、タスクに着手する
	- 元のStatusがIn Progressだった場合は変更する必要なし

- 参考: jsonで取得した時の形式
```json
{
	"items": [
    {
      "content": {
        "body": "",
        "number": 2,
        "repository": "jankey-kkoba/PJ003_GYARA-NOMI",
        "title": "ゲストは一覧で表示したキャストの年齢で表示内容を絞り込むことができる",
        "type": "Issue",
        "url": "https://github.com/jankey-kkoba/PJ003_GYARA-NOMI/issues/2"
      },
      "feature": "キャスト情報閲覧",
      "id": "PVTI_lAHODTGhKs4BB5sLzghh46w",
      "iteration": {
        "duration": 7,
        "iterationId": "51a3d0b6",
        "startDate": "2025-11-17",
        "title": "Iteration1"
      },
      "labels": [
        "type:enhancement",
      ],
      "point": 3,
      "repository": "https://github.com/jankey-kkoba/PJ003_GYARA-NOMI",
      "status": "Todo",
      "title": "ゲストは一覧で表示したキャストの年齢で表示内容を絞り込むことができる"
    }
	]
}
```
- Status="Todo"または"In Progress"のタスクとはitems[n].status = "Todo"またはitems[n].status = "In Progress"のものを指す