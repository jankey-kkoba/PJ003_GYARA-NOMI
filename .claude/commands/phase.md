開発フェーズに応じてMCPプロファイルを切り替える

# 引数
$ARGUMENTS: フェーズ名 (plan | impl | refactor | test | deploy)

# フェーズ一覧
| フェーズ | 説明 | 有効なMCP | 推定tokens |
|---------|------|----------|-----------|
| plan | 計画・調査 | serena | ~13k |
| impl | 実装 | serena, supabase-local, next-devtools | ~26k |
| refactor | リファクタリング | serena, supabase-local, next-devtools | ~26k |
| test | テスト | serena, supabase-local, next-devtools, playwright | ~43k |
| deploy | デプロイ | serena, supabase, next-devtools, vercel, playwright | ~57k |

# 手順

## 引数が空の場合
1. 現在の `.claude/settings.local.json` の `enabledMcpjsonServers` を読み込み、現在のフェーズを推定して表示
2. フェーズ一覧を提示し、切り替えるか確認

## 引数が指定されている場合

### Step 1: 進捗保存（Issue更新）
1. 現在のtodoリストを確認
2. 作業中のIssue番号を特定（In Progressのタスクから）
3. 以下の形式でIssueにコメントを追加:
```
## フェーズ切り替え: [現在のフェーズ] → [新しいフェーズ]

### 完了した作業
- [完了したtodo項目を列挙]

### 次のフェーズで行う作業
- [残りのtodo項目を列挙]

### 備考
- フェーズ切り替えに伴いClaude Code再起動
```

### Step 2: MCPプロファイル更新
1. `.claude/mcp-profiles/$ARGUMENTS.json` を読み込む
2. `.claude/settings.local.json` の `enabledMcpjsonServers` を更新する
3. 変更内容をユーザーに報告する

### Step 3: 再起動案内
1. 以下を伝える:
   - MCPの変更を反映するにはClaude Codeの再起動が必要
   - 再起動後、`/task-restart` で作業を再開できる
   - `/context` でMCPトークン使用量を確認できる

# 注意事項
- フェーズ切り替えは必ずIssue更新とセットで行う
- 再起動後は `/task-restart` で作業を再開する
- 緊急時は再起動せずに作業を続行することも可能（ただしMCP変更は反映されない）
