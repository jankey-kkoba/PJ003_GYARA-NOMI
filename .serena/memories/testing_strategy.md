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

### 3. UI/コンポーネント層テスト (`__tests__/integration/ui/`)
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
│   └── ui/                     # UI/コンポーネント層テスト（featureで分類）
│       ├── auth/
│       ├── cast/
│       ├── favorite/
│       ├── solo-matching/
│       └── home/
└── e2e/                        # Playwright
```

**テスト配置ルール**:
- **UI層**: `ui/[feature]/` に配置（feature単位で整理、同名テストの衝突を防止）
- **API層**: `api/` に集約（ファイル名: `[domain].test.ts`）
- **サービス層**: `services/` に集約（ファイル名: `[domain]-service.test.ts`）

**Hooks層テストについて**:
- hooks層の単体テストは作成しない（Testing Trophy戦略に基づく）
- hooksは実装詳細として扱い、UI層テストで間接的に検証
- 例外: 複数UIから共有され、複雑なキャッシュロジックを持つ場合のみ検討

## 機能実装時のテスト作成ルール

**新機能を実装する際は、原則として以下の3層すべてにテストを追加すること**:

※ただし、変更が軽微で既存テストでカバーされている場合や、テストの価値が低いと判断した場合は省略可。その場合は理由をコミットメッセージやPRに明記すること。

1. **サービス層テスト** (`services/[domain]-service.test.ts`)
   - 実DBを使用したビジネスロジックの検証
   - データの作成・取得・更新・削除の正常系
   - エッジケース（フィルタリング、条件分岐等）

2. **API層テスト** (`api/[domain].test.ts`)
   - 認証・認可チェック
   - パラメータバリデーション（400エラー）
   - 正常系レスポンス

3. **UI層テスト** (`ui/[feature]/[component].test.tsx`)
   - フォームの表示・入力・送信
   - ローディング・エラー状態
   - ユーザー操作に対する反応

**チェックリスト**:
- [ ] サービス層: DBクエリとビジネスロジックのテスト
- [ ] API層: バリデーションと認証のテスト
- [ ] UI層: コンポーネントの統合テスト

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
- ✅ `ui/favorite/favorite-button.test.tsx` - UI層

### キャスト一覧/検索機能
- ✅ `api/casts.test.ts` - API層（認証、ロール、バリデーション、ページネーション、フィルター）
- ✅ `services/cast-service.test.ts` - サービス層（実DB、年齢フィルタ）
- ✅ `ui/cast/cast-list-template.test.tsx` - UI層（フィルター統合含む）
- ✅ `ui/cast/cast-detail-template.test.tsx` - UI層
- ✅ `ui/cast/cast-filter-dialog.test.tsx` - フィルターダイアログ

### 認証機能
- ✅ `unit/libs/auth/adapter.test.ts` - Auth.jsカスタムアダプター
- ✅ `api/users.test.ts` - ユーザー登録API
- ✅ `ui/auth/*.test.tsx` - UI層（login, register, logout等）

### ソロマッチング機能
- ✅ `api/solo-matchings.test.ts` - API層（ゲスト向け）
- ✅ `api/solo-matchings-cast.test.ts` - API層（キャスト向け）
- ✅ `services/solo-matching-service.test.ts` - サービス層
- ✅ `ui/solo-matching/*.test.tsx` - UI層

## 注意事項

- `input type="number"`の`toHaveValue`は数値を期待する
- ダイアログコンポーネントは`@radix-ui/react-dialog`の警告が出るが無視可能
- 複雑なページ遷移を含むテストはフレーク（不安定）になりやすいので避ける

## API層テストのバリデーションエラー検証について

### バリデーションテストの方針
- **400ステータスコードの確認のみで十分**
- エラーメッセージの詳細内容まで検証する必要はない（詳細はZodスキーマのUnitテストで検証済み）
- 例：

```typescript
// 推奨: シンプルにステータスのみ確認
it('無効なresponseの場合は400エラーを返す', async () => {
  const response = await app.request('/api/endpoint', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: 'invalid' }),
  })
  expect(response.status).toBe(400)
})

// 非推奨: エラーメッセージの詳細まで検証（保守性が低下）
it('無効なresponseの場合は400エラーを返す', async () => {
  // ...
  expect(body.error.message).toContain('accepted')  // ❌ 避ける
})
```

## E2Eテストで避けるべきパターン

### ローディング状態のテスト
- **E2Eでローディング状態をテストするのは避ける**
- ネットワーク速度やサーバーレスポンス時間に依存し、フレーキー（不安定）になりやすい
- ローディング状態のテストは**UI層のIntegrationテスト**で実施する

```typescript
// E2Eで避けるべき例
test('ローディング中はローディングインジケーターが表示される', async ({ page }) => {
  await page.route('**/api/casts*', async (route) => {
    await page.waitForTimeout(1000)  // ❌ 人工的な遅延は不安定
    await route.continue()
  })
  await page.goto('/casts')
  await expect(page.getByText('読み込み中...')).toBeVisible()  // ❌ フレーキー
})

// 代わりにUI層Integrationテストで実施
// __tests__/integration/ui/cast/cast-list-template.test.tsx
it('ローディング中はローディングインジケーターが表示される', async () => {
  // モックを使って確実にローディング状態を作り出せる
})
```

### E2Eで書くべきテスト
- ユーザーの重要なジャーニー（認証フロー、マッチングフロー等）
- 複数ページにまたがる操作フロー
- 実際のブラウザ環境でしか検証できないこと

### E2Eで書くべきでないテスト
- ローディング状態の表示確認
- 一時的なUI状態（トースト、ツールチップ等）
- ネットワーク遅延に依存するテスト
- 単一コンポーネントの振る舞い（UI層Integrationテストで実施）
