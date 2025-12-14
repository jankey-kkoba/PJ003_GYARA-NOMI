---
description: コードレビューを実施
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(git status:*), mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__find_referencing_symbols
---

# コードレビュー

## 対象の特定

引数が指定されている場合: $ARGUMENTS
引数がない場合: 以下のコマンドで現在の差分を取得し、変更ファイルを対象とする

```sh
git diff --name-only HEAD
git diff HEAD
```

## レビュー観点

### 1. SOLID原則
- 単一責任の原則: 1つのモジュールは1つの責務
- 開放閉鎖の原則: 拡張に開き、修正に閉じる
- リスコフの置換原則: 派生クラスの置換可能性
- インターフェース分離: 必要最小限のインターフェース
- 依存性逆転: 抽象への依存

### 2. プロジェクト規約準拠
- インポートパス: `@/` を使った絶対パス使用
- 環境変数: `libs/constants/env.ts` 経由で参照
- ライブラリラッピング: 直接インポートせずラップ

### 3. React/Next.js規約
- useEffectは可能な限り使用しない
- Tanstack Query経由でAPI呼び出し
- サーバー/クライアントの完全分離
- appフォルダ内でロジック・UI描画しない

### 4. セキュリティ
- OWASP Top 10対策
- SQLインジェクション防止
- XSS対策
- 認証・認可チェック

### 5. テスト容易性
- Testing Trophy戦略に基づく設計
- モック可能な依存関係
- ユーザー視点でのテスト可能性

### 6. パフォーマンス
- 不要な再レンダリング防止
- 適切なメモ化（useMemo, useCallback）
- バンドルサイズへの影響

## 手順

1. `git diff` で変更内容を確認
2. 変更ファイルの構造を `mcp__serena__get_symbols_overview` で把握
3. 関連シンボルへの影響を `mcp__serena__find_referencing_symbols` で確認
4. CLAUDE.mdの規約と照合

## 出力形式

1. **Must Fix（必須）**: セキュリティ問題、バグ
2. **Should Fix（推奨）**: 規約違反、パフォーマンス問題
3. **Consider（検討）**: リファクタリング提案、ベストプラクティス
4. 各指摘に対する具体的な修正コード例
