# プロジェクトの概要
- 「ギャラ飲み」プラットフォームアプリケーション

# YOU MUST: 
- 指示内容にない作業(例: 指示に含まれない機能の実装)は実施しない
- 思考は英語で応答は日本語で行う
- コードのコメントやコミットメッセージ、ドキュメントは日本語で作成すること

# アクター
## キャスト
- 料金をもらい、ゲストと飲み会をする女性ユーザー
## ゲスト
- 料金を払い、キャストと飲み会をする男性ユーザー
## 管理者
- 通報等への対応やマスタの管理等を行う

# 主要となる機能
## LINEログイン
- キャストとゲストはLINE認証を利用して会員登録・ログインを簡単に行うことができる
## ソロマッチング
- ゲストがキャストを選んで1対1でギャラ飲みを行うことができる
## グループマッチング
- ゲストが条件を指定して複数キャストにオファーを出し、複数キャストを呼んでギャラ飲みすることができる
## チャット
- ゲストとキャストでチャットすることができる

# 主な制約
## LINEログイン
- ログインはLINEログインのみでの実装となる
- バックエンドでsupabaseを使用する関係上、Auth.jsでのLINE認証を行う(supabase authは2025/11/16現在LINEに対応していない)
## 決済
- 決済は今のところ[komoju](https://en.komoju.com)を想定している
- 業種の都合上プラットフォームによっては却下されてしまう可能性もあり、決済部分のコンポーネントは代替可能な設計にしたい
- 利用に際して直接決済するのではなく、事前にポイントを購入させる仕組みを導入する
## 使用想定端末
- mobile firstでの実装を行う
- ゲスト、キャストが利用する画面は基本的にスマホでのビューのみを想定
- 管理者の画面はPCでの利用も想定

# 技術スタック
- Frontend: Next.js 16 AppRouter
- hosting: vercel
- Backend: Supabase
- Auth: Auth.js
- ORM: Drizzle (docs/db/index.mdを参照)
- Test: vitest
- Test: playwright
- TailwindCSS
- radix UI
- Tanstack Query
- hono(docs/lib/hono.mdを参照)

# 開発規約
- 各モジュール、コンポーネントはSOLID原則に従いコーディングする
- ライブラリなどは直接インポートするのではなく後で代替が簡単になるよう、ラッピングすること
- フロントエンドの実装に関しては以下のようなフォルダ構成で行う
- UIとロジックを担当するファイルは分離する
- appフォルダ内で直接ロジックやUIの描画は行わない page.tsx内でコンポーネントを呼び出すのみとする
```
frontend
├── __tests__
├── app/ # App Router
├── features/ # 主にドメインに関するコンポーネントやhooks、サービスなど
├── ├── api/
├── ├── components/ # 内部の構造はcomponents同様[Atomic Design](https://atomicdesign.bradfrost.com/)を取り入れる
├── ├── hooks/
├── ├── services/
├── ├── types/
├── components/ # 主に共通コンポーネント([Atomic Design](https://atomicdesign.bradfrost.com/)を取り入れる)
├── hooks/ # ドメインを跨いで利用されるもの
├── types/ # ドメインを跨いで利用されるもの
├── libs/ # ライブラリをラッパーするファイルや抽象化したファイル
├── util/ # 日付操作などのアプリケーションを通じて利用されるような便利な関数など
```
- チャット機能などの一部の機能を除き、クライアントとsupabaseで直接通信するのではなくAPI Routesを利用する

## コーディング規約の詳細
### インポートパス
- フォルダの指定には相対パス(`./`, `../`)を使用せず、可能な限り`@/`を使った絶対パスを利用する
  - 例: `import { foo } from '@/libs/bar'`

### 設定値とマジックナンバー
- ハードコーディングは避け、定数ファイルで管理する
- ライブラリの設定値は`libs/[ライブラリ名]/constants/`に定義する
  - 例: `libs/react-query/constants/index.ts`で`DEFAULT_STALE_TIME`を定義

### 環境変数
- 環境変数は直接参照せず、`libs/constants/env.ts`で定数として定義し、そこから参照する
- 実際に使用する環境変数のみを定義する（未使用のものは定義しない）
- 例:
```typescript
// libs/constants/env.ts
export const DATABASE_URL = process.env.DATABASE_URL!

// 他のファイル
import { DATABASE_URL } from '@/libs/constants/env'
```
