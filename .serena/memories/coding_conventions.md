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
