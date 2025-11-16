# ギャラ飲みプラットフォーム - フロントエンド

Next.js 16 App Routerを使用した「ギャラ飲み」プラットフォームのフロントエンドアプリケーション。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: React 19
- **スタイリング**: TailwindCSS v4
- **UIコンポーネント**: Radix UI
- **状態管理**: Tanstack Query (React Query)
- **データベースORM**: Drizzle ORM
- **認証**: Auth.js (NextAuth v5)
- **API**: Hono
- **テスト**: Vitest, Playwright
- **ホスティング**: Vercel
- **バックエンド**: Supabase

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseプロジェクト

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

### 環境変数

`.env`ファイルに以下の環境変数を設定してください:

- `NEXTAUTH_URL`: アプリケーションのURL
- `NEXTAUTH_SECRET`: Auth.jsのシークレットキー
- `LINE_CLIENT_ID`: LINE OAuth クライアントID
- `LINE_CLIENT_SECRET`: LINE OAuth クライアントシークレット
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー
- `DATABASE_URL`: データベース接続URL
- `KOMOJU_SECRET_KEY`: Komoju決済シークレットキー
- `KOMOJU_PUBLIC_KEY`: Komoju決済パブリックキー

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが起動し、[http://localhost:3000](http://localhost:3000)でアクセスできます。

## スクリプト

- `npm run dev`: 開発サーバーの起動
- `npm run build`: プロダクションビルド
- `npm run start`: プロダクションサーバーの起動
- `npm run lint`: ESLintによるコードチェック
- `npm run test`: Vitestによるユニットテスト実行
- `npm run test:e2e`: PlaywrightによるE2Eテスト実行
- `npm run db:generate`: Drizzleスキーマからマイグレーションファイルを生成
- `npm run db:migrate`: マイグレーションの実行
- `npm run db:push`: スキーマをデータベースにプッシュ
- `npm run db:studio`: Drizzle Studioの起動

## プロジェクト構成

```
frontend/
├── src/
│   ├── __tests__/          # テストファイル
│   ├── app/                # Next.js App Router
│   ├── features/           # ドメイン固有の機能
│   │   ├── api/           # API関連
│   │   ├── components/    # ドメイン固有のコンポーネント
│   │   ├── hooks/         # ドメイン固有のフック
│   │   ├── services/      # ビジネスロジック
│   │   └── types/         # ドメイン固有の型定義
│   ├── components/         # 共通UIコンポーネント (Atomic Design)
│   │   ├── atoms/         # 最小単位のコンポーネント
│   │   ├── molecules/     # 原子の組み合わせ
│   │   ├── organisms/     # 分子の組み合わせ
│   │   └── templates/     # ページテンプレート
│   ├── hooks/              # 共通カスタムフック
│   ├── types/              # 共通型定義
│   ├── libs/               # ライブラリのラッパー
│   │   ├── auth/          # Auth.js設定
│   │   ├── db/            # Drizzle ORM設定
│   │   ├── react-query/   # React Query設定
│   │   └── supabase/      # Supabaseクライアント
│   └── utils/              # ユーティリティ関数
├── drizzle/                # マイグレーションファイル
├── public/                 # 静的ファイル
└── playwright.config.ts    # Playwright設定
```

## 開発規約

### コーディング原則

- SOLID原則に従う
- UIとロジックを分離する
- ライブラリは直接インポートせず、ラッパーを介して使用する
- `app/`フォルダ内では直接ロジックやUIを書かず、コンポーネントを呼び出すのみとする

### コンポーネント設計

- Atomic Designパターンを採用
- 各コンポーネントは単一責任の原則に従う
- propsは明示的に型定義する

### API通信

- チャット機能など一部を除き、クライアントとSupabaseの直接通信は避ける
- API Routesを経由して通信する

## ライセンス

Private
