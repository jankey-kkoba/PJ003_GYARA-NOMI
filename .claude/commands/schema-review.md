---
description: データベーススキーマ設計をレビュー
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__supabase-local__list_tables, mcp__supabase-local__execute_sql
---

# スキーマ設計レビュー

## 対象の特定

引数が指定されている場合: $ARGUMENTS
引数がない場合: 以下のコマンドで現在の差分を取得し、スキーマ関連ファイルを対象とする

```sh
git diff --name-only HEAD -- '*.sql' 'src/db/**'
git diff HEAD -- '*.sql' 'src/db/**'
```

## レビュー観点

### 1. 正規化設計
- 第三正規形への準拠
- データ冗長性の排除
- 適切なテーブル分割

### 2. リレーション設計
- 外部キー制約の適切性
- カスケード設定（ON DELETE, ON UPDATE）
- 多対多関係の中間テーブル設計

### 3. 型設計
- 適切なデータ型の選択
- NULL許容の妥当性
- デフォルト値の設定

### 4. インデックス戦略
- 主キー以外のインデックス必要性
- 複合インデックスの検討
- クエリパターンに基づく最適化

### 5. Drizzle ORM準拠
- `src/db/schema.ts` のパターン踏襲
- 型安全性の確保
- マイグレーション手順の確認

### 6. RLSポリシー
- Row Level Securityの必要性検討
- ユーザー種別（キャスト/ゲスト/管理者）に応じたアクセス制御

## 手順

1. 対象スキーマを確認
2. 既存の関連テーブルとの整合性を確認
3. `mcp__supabase-local__list_tables` で現在のテーブル構造を確認
4. 改善提案を優先度付きで提示

## 出力形式

1. 設計上の問題点（優先度: 高/中/低）
2. 改善後のスキーマ定義（Drizzle形式）
3. 必要なマイグレーションSQL
4. RLSポリシー提案（該当する場合）
