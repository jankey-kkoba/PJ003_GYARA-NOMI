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
- ORM: Drizzle (@docs/db.md)
- Test: vitest
- Test: playwright
- TailwindCSS
- radix UI
- shadcn/ui（デザインシステム）
- Tanstack Query
- hono(docs/lib/hono.mdを参照)

# 開発規約
- 各モジュール、コンポーネントはSOLID原則に従いコーディングする
- ライブラリなどは直接インポートするのではなく後で代替が簡単になるよう、ラッピングすること
- UIとロジックを担当するファイルは分離する
- appフォルダ内で直接ロジックやUIの描画は行わない page.tsx内でコンポーネントを呼び出すのみとする
- クライアントとサーバーは完全に分けて実装する
  - データの取得や更新はサーバーサイドのコンポーネントでは行わない
  - Tanstack Queryの活用などにより通信回数を最適化する
  - チャットなどのリアルタイムな購読については例外
- フロントエンドの実装に関しては以下のようなフォルダ構成で行う
```
frontend
├── __tests__ # テストはここに書く
├── __mocks__ # モック実装
├── src
    ├── app/ # App Router
    ├── features/ # 主にドメインに関するコンポーネントやhooks、サービスなど
        ├── api/
        ├── components/ # 内部の構造はcomponents同様[Atomic Design](https://atomicdesign.bradfrost.com/)を取り入れる
        ├── hooks/
        ├── services/
        ├── types/
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

### useEffectの使用について
- `useEffect`は可能な限り使用しない
  - 参照: https://ja.react.dev/reference/react/useEffect
  - Reactの公式ドキュメントにある通り、多くの場合useEffectは不要
- 以下の場合はuseEffect以外の方法を検討する:
  - **レンダー中に計算できるデータ**: `useMemo`を使用
  - **ユーザーイベントの処理**: イベントハンドラで直接処理
  - **状態のリセット**: `key`プロパティを使用
  - **propsの変更に応じた状態更新**: レンダー中に直接計算
- useEffectが適切な場合:
  - 外部システムとの同期（WebSocket、サードパーティライブラリなど）
  - コンポーネントのマウント時の一度きりの処理

### APIとサーバー通信
- サーバーとの通信には**Tanstack Query (React Query)**を使用する
  - データの取得: `useQuery`
  - データの更新: `useMutation`
  - キャッシュ管理、再取得、エラーハンドリングを統一的に扱う
- Tanstack Queryのラッパーは`libs/react-query/`に配置する
- 直接fetchやaxiosを使用せず、Tanstack Query経由でAPI呼び出しを行う
- 例:
```typescript
// features/[domain]/hooks/useXxx.ts
import { useQuery, useMutation } from '@/libs/react-query'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (data: CreateUserInput) => createUser(data),
  })
}
```

### デザインシステム（shadcn/ui）
- UIコンポーネントは**shadcn/ui**をベースに構築する
  - 参照: https://ui.shadcn.com/
  - Radix UIプリミティブをベースにしたカスタマイズ可能なコンポーネント
- **shadcn/uiコンポーネントを必ず優先して使用すること**
  - Card、Button、Input、Select等の基本UIは必ずshadcn/uiを使用する
  - 自前でdivとTailwindクラスでスタイリングする前に、shadcn/uiに該当コンポーネントがないか確認する
  - コンポーネントが存在しない場合は`npx shadcn@latest add [component]`で追加する
- shadcn/uiコンポーネントは`components/ui/`に配置する
  - `npx shadcn@latest add [component]`でコンポーネントを追加
  - 追加後は自由にカスタマイズ可能
- デザイントークン（カラー、スペーシング等）は`globals.css`の`@theme`で管理する
- コンポーネント構成:
  ```
  components/
  ├── ui/           # shadcn/uiベースのプリミティブコンポーネント
  ├── atoms/        # 独自の基本コンポーネント
  ├── molecules/    # 複合コンポーネント
  └── organisms/    # 大きな機能単位のコンポーネント
  ```
- shadcn/uiコンポーネントを使用する際は`@/components/ui/`からインポートする
  - 例: `import { Button } from '@/components/ui/button'`
  - 例: `import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'`
- 既存のRadix UIラッパー（`libs/radix-ui/`）との使い分け:
  - 新規UIコンポーネント: shadcn/uiを優先
  - 既存のカスタム実装: 必要に応じてshadcn/uiに移行

### 認証関連
- 認証ロジックは`useAuth`カスタムフックで定義する
  - 場所: `features/auth/hooks/useAuth.ts`
  - next-authのライブラリを直接インポートせず、`useAuth`フック経由で利用する
  - `useAuth`は以下を返す:
    - `session`: セッション情報
    - `status`: 認証状態
    - `isAuthenticated`: 認証済みかどうか
    - `isLoading`: ローディング中かどうか
    - `user`: ユーザー情報
    - `lineLogin()`: LINEログイン処理
    - `logout()`: ログアウト処理
- Auth.jsのSessionProviderは`AuthProvider`コンポーネントでラップする
  - 場所: `features/auth/components/providers/AuthProvider.tsx`
  - layout.tsxで全体をラップする

### テスト戦略
Testing Trophy（https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications）の考え方に基づき、Integration テストを最重視する戦略を採用する。

#### テストの種類と比率
```
        E2E          ← 5-10%: 重要なユーザーフローのみ
    Integration      ← 60-70%: 最も重点を置く（confidence / cost のバランス最良）
      Unit           ← 20-25%: ユーティリティや複雑なロジックのみ
      Static         ← 100%: TypeScript / ESLint
```

#### テストツールの使い分け
| テスト種別 | ツール | 用途 |
|-----------|--------|------|
| Unit | Vitest (jsdom) | 純粋関数、ユーティリティ、Zodスキーマ |
| Component/Integration | **Vitest Browser Mode** | コンポーネント統合、API統合、認証フロー |
| E2E | Playwright | 複数ページにまたがるユーザージャーニー |

#### Vitest Browser Mode の採用理由
- **実ブラウザ環境**: jsdom のシミュレーションではなく、実際のブラウザで CSS レンダリング・イベント処理を検証
- **高い信頼性**: Testing Trophy の核心である「confidence（確信）」を最大化
- **ツール統一**: Playwright を E2E と共有し、ブラウザのインストールが1回で済む
- **モバイル対応**: 実際のレスポンシブ動作を確認可能

#### テストファイルの配置
テストは `frontend/__tests__/` に配置する（`src` 外に置くことでソースコードとの明確な分離を実現）。

```
frontend/__tests__/
├── setup.ts                    # グローバルセットアップ
├── utils/                      # テストユーティリティ
├── unit/                       # Vitest (jsdom) - 純粋関数のみ
│   ├── utils/
│   │   └── cn.test.ts
│   └── features/
│       └── user/
│           └── validation.test.ts
├── integration/                # Vitest Browser Mode
│   ├── api/
│   │   └── users.test.ts
│   ├── features/
│   │   ├── auth/
│   │   │   └── register-flow.test.tsx
│   │   └── user/
│   └── auth/
│       └── adapter.test.ts
└── e2e/                        # Playwright
    ├── auth/
    │   └── login-flow.spec.ts
    └── routing/
        └── protected-routes.spec.ts
```

#### テストの原則
1. **ユーザー視点でテストを書く**
   - 実装詳細（state, props）ではなく、ユーザーが見るもの（表示、操作結果）をテスト
   - `getByRole`, `getByLabelText` 等のアクセシビリティベースのクエリを優先

2. **モックは最小限に**
   - 外部 API（LINE OAuth 等）のみモック
   - DB は可能な限りテスト用 DB を使用
   - React Query の実際の動作を活用

3. **書くべきテスト**
   - ビジネスロジックの検証
   - ユーザーフローの動作確認
   - エラーハンドリング
   - バリデーション

4. **書くべきでないテスト**
   - shadcn/ui コンポーネントの単体テスト（既にテスト済み）
   - シンプルな props 受け渡し
   - 実装詳細の検証

#### 優先してテストすべき機能
1. **認証・ユーザー管理**: useAuth, CustomAdapter, 登録フロー
2. **API エンドポイント**: バリデーション、認証チェック、エラーハンドリング
3. **フォームコンポーネント**: RegisterTemplate, LoginTemplate
4. **保護されたルート**: 認証状態によるリダイレクト

#### テスト実行コマンド
```bash
# Unit + Integration テスト
npm run test

# E2E テスト
npm run test:e2e

# ウォッチモード
npm run test -- --watch

# カバレッジ
npm run test -- --coverage
```
