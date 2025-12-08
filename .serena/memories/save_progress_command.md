# 進捗保存スラッシュコマンド

## 概要
コンテキスト使用量が増えてきた際に、作業進捗をGitHub Issueに保存するためのスラッシュコマンド。

## 使用方法
```
/save-progress
```

## コマンドの場所
`.claude/commands/save-progress.md`

## 用途
- 長時間の作業でコンテキストが増えてきた場合
- 作業を中断して後で再開する場合
- 複数セッションにまたがる作業の引き継ぎ

## 処理内容
1. 現在のtodoリストを確認
2. 作業中のIssue番号を特定
3. `gh issue comment` で進捗をコメント追加
4. 必要に応じて中間コミット作成

## 関連
- `/task` コマンド: タスク一覧取得・作業開始
- `/task-restart` コマンド: In Progressのタスクから作業を再開
- issue_based_workflow.md: Issue駆動開発のワークフロー

## 推奨フロー
1. 作業中断時: `/save-progress` で進捗をIssueに保存
2. 作業再開時: `/task-restart` でIn Progressのタスクから再開
   - `/task` は新規タスク選択時に使用
