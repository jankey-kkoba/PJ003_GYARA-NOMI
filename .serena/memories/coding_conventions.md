# コーディング規約

## 基本原則
- SOLID原則に従う
- UIとロジックを分離
- ライブラリは直接インポートせずラッピングする
- クライアントとサーバーは完全分離

## インポート
- 相対パス(`./`, `../`)ではなく絶対パス(`@/`)を使用
- 例: `import { foo } from '@/libs/bar'`

## 定数・環境変数
- ハードコーディングを避け、定数ファイルで管理
- 環境変数は`libs/constants/env.ts`で定義してから参照

## React
- `useEffect`は可能な限り使用しない
- データ取得にはTanstack Query (`useQuery`, `useMutation`)を使用
- UIコンポーネントはshadcn/uiを優先使用

## UIスタイリング
### 色の指定
- **`globals.css`のセマンティックカラートークンを使用する**
  - 正: `text-muted-foreground`, `text-destructive`, `bg-card`, `border-border`
  - 誤: `text-gray-500`, `bg-gray-50`, `text-red-500`, `bg-red-50`
- ハードコードされた色クラスは使用しない
- セマンティックトークン一覧:
  - テキスト: `text-foreground`, `text-muted-foreground`, `text-destructive`
  - 背景: `bg-background`, `bg-card`, `bg-muted`, `bg-destructive`
  - ボーダー: `border-border`, `border-input`
  - その他: `ring-ring`, `text-primary`, `bg-primary`

### デザインパターンの統一
- **既存コンポーネントのパターンを参考にする**
  - 新規コンポーネント作成前に類似コンポーネントを確認
  - 例: ローディング表示 → `SectionLoading`コンポーネントを使用
  - 例: エラー表示 → `text-destructive`でメッセージ表示
  - 例: 空状態 → `text-muted-foreground`でメッセージ表示
- カスタムコンポーネントを作成せず、既存の共通コンポーネントを活用
- 同じ機能のコンポーネントを重複して実装しない

### スタイリングの優先順位
1. shadcn/uiコンポーネント（Card, Button, Badge等）
2. 既存の共通コンポーネント（SectionLoading等）
3. globals.cssのセマンティックトークン
4. Tailwind標準クラス（margin, padding等）

## 認証
- `useAuth`カスタムフック経由でnext-authを使用
- 場所: `features/auth/hooks/useAuth.ts`

## API
- クライアントからsupabaseに直接通信せず、API Routes経由
- チャット等リアルタイム機能は例外

## コメント・ドキュメント
- コード・コミットメッセージ・ドキュメントは日本語

## ファイル構成
- `app/`内ではpage.tsxでコンポーネントを呼び出すのみ
- 直接ロジックやUI描画を行わない
