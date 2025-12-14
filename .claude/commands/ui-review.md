---
description: UI/UXの観点からコンポーネントをレビュー
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), mcp__serena__find_symbol, mcp__serena__get_symbols_overview
---

# UI/UXレビュー

## 対象の特定

引数が指定されている場合: $ARGUMENTS
引数がない場合: 以下のコマンドで現在の差分を取得し、変更されたUIファイルを対象とする

```sh
git diff --name-only HEAD
git diff HEAD
```

## レビュー観点

以下の観点でコンポーネントをレビューしてください。

### 1. shadcn/ui活用
- `components/ui/` の既存コンポーネント（Card, Button, Badge等）を使用しているか
- 自前でdiv+Tailwindでスタイリングしていないか
- 未使用のshadcn/uiコンポーネントがあれば `npx shadcn@latest add [component]` を提案

### 2. セマンティックカラートークン
- globals.cssで定義されたトークンを使用しているか
- 正しい例: `text-muted-foreground`, `bg-card`, `border-border`
- 誤った例: `text-gray-500`, `bg-gray-50`（ハードコード禁止）

### 3. 既存パターンの踏襲
- ローディング表示: `SectionLoading` コンポーネント使用
- カード表示: `CastCard` 等の既存パターン参照
- エラー表示: `text-destructive` 使用

### 4. アクセシビリティ
- ARIA属性の適切な使用
- キーボードナビゲーション対応
- `getByRole`, `getByLabelText` でテスト可能な構造

### 5. モバイルファースト
- スマホでの表示を最優先
- レスポンシブ対応（必要な場合のみ）

### 6. コンポーネント分離
- UIとロジックの分離
- appフォルダ内でロジックやUI描画を行っていないか

## 出力形式

1. 問題点のリスト（優先度: 高/中/低）
2. 具体的な改善コード例
3. 参考にすべき既存コンポーネントへのリンク
