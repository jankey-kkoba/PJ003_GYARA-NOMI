# テスト戦略と方針

## Testing Trophy アプローチ

本プロジェクトはTesting Trophy（Kent C. Dodds提唱）に基づき、**Integration テストを最重視**する。

```
        E2E          ← 5-10%: 重要なユーザーフローのみ
    Integration      ← 60-70%: 最も重点（confidence / cost バランス最良）
      Unit           ← 20-25%: ユーティリティや複雑なロジックのみ
      Static         ← 100%: TypeScript / ESLint
```

## テストツールと使い分け

| テスト種別 | ツール | 用途 |
|-----------|--------|------|
| Unit | Vitest (jsdom) | 純粋関数、ユーティリティ、Zodスキーマ |
| Component/Integration | **Vitest Browser Mode** | コンポーネント統合、API統合、認証フロー |
| E2E | Playwright | 複数ページにまたがるユーザージャーニー |

## テストの層構造と責務

### 1. API層テスト (`__tests__/integration/api/`)
- **サービスをモック**してAPIロジックに焦点
- 検証項目:
  - 認証チェック（401）
  - ロールチェック（403）
  - パラメータバリデーション（400）
  - 正常系レスポンス（200）
  - エラーハンドリング（404, 500）

```typescript
// 例: casts.test.ts, favorites.test.ts
vi.mock('@/features/cast/services/castService', () => ({
  castService: { getCastList: vi.fn(), getCastById: vi.fn() },
}))
```

### 2. サービス層テスト (`__tests__/integration/services/`)
- **実DBを使用**してDBクエリとビジネスロジックを検証
- Node.js環境で実行（`npm run test:node`）
- ローカルSupabaseの起動が必要

```typescript
// 例: cast-service.test.ts, favorite-service.test.ts
// seed.sqlのテストデータを使用
const GUEST_ID = 'seed-user-guest-001'
```

### 3. コンポーネント/Hooks層テスト (`__tests__/integration/features/`)
- Vitest Browser Modeで実ブラウザ環境テスト
- Hono クライアントをモック
- 検証項目:
  - ローディング状態
  - エラー状態
  - 正常表示
  - ユーザー操作（クリック、入力）
  - API呼び出しパラメータ

```typescript
// 例: cast-list-template.test.tsx
vi.mock('@/libs/hono/client', () => ({
  castsClient: { api: { casts: { $get: mockGet } } },
}))
```

## ファイル配置規則

```
frontend/__tests__/
├── setup.ts
├── utils/                      # テストユーティリティ
├── unit/                       # Vitest (jsdom)
│   ├── utils/
│   ├── libs/
│   └── features/
├── integration/                # Vitest Browser Mode & Node.js
│   ├── api/                    # API層テスト
│   ├── services/               # サービス層テスト（Node.js環境）
│   ├── hooks/                  # Hooks層テスト（全hooksを集約）
│   │   ├── use-auth.test.tsx
│   │   ├── use-cast-list.test.tsx
│   │   └── use-*.test.tsx
│   └── ui/                     # UI/コンポーネント層テスト（featureで分類）
│       ├── auth/
│       ├── cast/
│       ├── favorite/
│       ├── solo-matching/
│       └── home/
└── e2e/                        # Playwright
```

**テスト配置ルール**:
- **Hooks層**: `hooks/` に集約（ファイル名: `use-[name].test.tsx`）
- **UI層**: `ui/[feature]/` に配置（feature単位で整理、同名テストの衝突を防止）
- **API層**: `api/` に集約（ファイル名: `[domain].test.ts`）
- **サービス層**: `services/` に集約（ファイル名: `[domain]-service.test.ts`）

## テストの原則

### ユーザー視点でテストを書く
- 実装詳細（state, props）ではなく、ユーザーが見るもの（表示、操作結果）をテスト
- `getByRole`, `getByLabelText` 等のアクセシビリティベースのクエリを優先

### モックは最小限に
- 外部API（LINE OAuth等）のみモック
- DBは可能な限りテスト用DBを使用
- React Queryの実際の動作を活用

### 書くべきテスト
- ビジネスロジックの検証
- ユーザーフローの動作確認
- エラーハンドリング
- バリデーション

### 書くべきでないテスト
- shadcn/ui コンポーネントの単体テスト（既にテスト済み）
- シンプルな props 受け渡し
- 実装詳細の検証

## テスト実行コマンド

```bash
# ブラウザ環境テスト（Unit + Integration）
npm run test

# Node.js環境テスト（DB操作とAPIのテスト）
npm run test:node

# E2E テスト
npm run test:e2e

# 特定のファイル/ディレクトリ
npm run test -- --run __tests__/integration/features/cast/
```

## 現在のテストカバレッジ状況

### お気に入り機能
- ✅ `api/favorites.test.ts` - API層（認証、ロール、CRUD）
- ✅ `services/favorite-service.test.ts` - サービス層（実DB）
- ✅ `hooks/use-favorite.test.tsx` - Hooks層
- ✅ `ui/favorite/favorite-button.test.tsx` - UI層

### キャスト一覧/検索機能
- ✅ `api/casts.test.ts` - API層（認証、ロール、バリデーション、ページネーション、フィルター）
- ✅ `services/cast-service.test.ts` - サービス層（実DB、年齢フィルタ）
- ✅ `hooks/use-cast-list.test.tsx` - Hooks層
- ✅ `ui/cast/cast-list-template.test.tsx` - UI層（フィルター統合含む）
- ✅ `ui/cast/cast-detail-template.test.tsx` - UI層
- ✅ `ui/cast/cast-filter-dialog.test.tsx` - フィルターダイアログ

### 認証機能
- ✅ `unit/libs/auth/adapter.test.ts` - Auth.jsカスタムアダプター
- ✅ `api/users.test.ts` - ユーザー登録API
- ✅ `hooks/use-auth.test.tsx` - Hooks層
- ✅ `ui/auth/*.test.tsx` - UI層（login, register, logout等）

### ソロマッチング機能
- ✅ `api/solo-matchings.test.ts` - API層（ゲスト向け）
- ✅ `api/solo-matchings-cast.test.ts` - API層（キャスト向け）
- ✅ `services/solo-matching-service.test.ts` - サービス層
- ✅ `hooks/use-create-solo-matching.test.tsx` - Hooks層
- ✅ `hooks/use-extend-solo-matching.test.tsx` - Hooks層
- ✅ `hooks/use-complete-solo-matching.test.tsx` - Hooks層
- ✅ `hooks/use-pending-offer.test.tsx` - Hooks層
- ✅ `ui/solo-matching/*.test.tsx` - UI層

## 注意事項

- `input type="number"`の`toHaveValue`は数値を期待する
- ダイアログコンポーネントは`@radix-ui/react-dialog`の警告が出るが無視可能
- 複雑なページ遷移を含むテストはフレーク（不安定）になりやすいので避ける
