# テスト戦略とテストデータ管理

このドキュメントでは、プロジェクトのテスト戦略とテストデータの管理方法について説明します。

## テスト戦略

Testing Trophy（https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications）の考え方に基づき、Integration テストを最重視する戦略を採用しています。

### テストの種類と比率

```
        E2E          ← 5-10%: 重要なユーザーフローのみ
    Integration      ← 60-70%: 最も重点を置く（confidence / cost のバランス最良）
      Unit           ← 20-25%: ユーティリティや複雑なロジックのみ
      Static         ← 100%: TypeScript / ESLint
```

### テストツールの使い分け

| テスト種別 | ツール | 用途 |
|-----------|--------|------|
| Unit | Vitest (jsdom) | 純粋関数、ユーティリティ、Zodスキーマ |
| Component/Integration | **Vitest Browser Mode** | コンポーネント統合、API統合、認証フロー |
| E2E | Playwright | 複数ページにまたがるユーザージャーニー |

## テストデータ管理

### seed.sqlによる事前データ準備

service層のテストでは、`supabase/seed.sql`で事前に用意されたテストデータを使用します。

#### seed.sqlのメリット

1. **テスト実行が高速化**: テストごとにデータを作成・削除する必要がない
2. **SQLの実行回数削減**: 一括でデータを準備できる
3. **手動での動作確認が容易**: `supabase db reset`で同じデータを再現できる
4. **テストの可読性向上**: テストコードからデータ作成のボイラープレートが削除される

#### データ命名規則

seed.sqlで作成されるデータは以下の命名規則に従います:

- **ID**: `seed-{domain}-{purpose}-{連番}`
  - 例: `seed-user-guest-001`, `seed-user-cast-001`
- **Email**: `seed-{purpose}@test.example.com`
  - 例: `seed-guest-001@test.example.com`, `seed-cast-001@test.example.com`
- **LINEアカウントID**: `seed-line-{purpose}-{連番}`
  - 例: `seed-line-guest-001`, `seed-line-cast-001`

#### seed.sqlの適用方法

```bash
# Supabaseディレクトリに移動（必要な場合）
cd supabase

# データベースをリセット（マイグレーション実行 + seed.sql適用）
supabase db reset

# 注意: supabase db reset は以下を実行します:
# 1. 既存のデータを全て削除
# 2. migrationsフォルダ内のマイグレーションを順番に実行
# 3. seed.sqlを実行
```

#### seed.sqlに含まれるデータ

以下のデータが事前に用意されています:

##### エリアマスタ
- `seed-area-shibuya`: 渋谷
- `seed-area-shinjuku`: 新宿
- `seed-area-roppongi`: 六本木
- `seed-area-ginza`: 銀座

##### ゲストユーザー
- **プロフィール登録済み**: `seed-user-guest-001`〜`seed-user-guest-003` (3件)
  - LINEアカウント連携済み
  - user_profiles登録済み
- **プロフィール未登録**: `seed-user-guest-no-profile` (1件)
  - LINEアカウント連携済み
  - user_profiles未登録

##### キャストユーザー
- **アクティブキャスト**: `seed-user-cast-001`〜`seed-user-cast-005` (5件)
  - LINEアカウント連携済み
  - user_profiles登録済み
  - cast_profiles登録済み (is_active=true)
  - エリア設定あり/なしのパターン含む
- **非アクティブキャスト**: `seed-user-cast-inactive` (1件)
  - is_active=false
- **プロフィール未登録キャスト**: `seed-user-cast-no-profile` (1件)
  - LINEアカウント連携済み
  - プロフィール未登録
- **ページネーションテスト用キャスト**: `seed-user-cast-page-001`〜`seed-user-cast-page-020` (20件)
  - ページネーションのテストに使用
  - ランクが1〜20で連番

##### その他
- **Googleアカウントユーザー**: `seed-user-google-001` (1件)
  - プロバイダー別テスト用

### テストコードでのseed.sqlデータの使用

#### 既存データを参照するテスト

```typescript
describe('getCastList', () => {
  it('アクティブなキャスト一覧を取得できる', async () => {
    // seed.sqlで用意されたデータを使用
    const result = await castService.getCastList({ page: 1, limit: 12 })

    // seed-user-cast-001を探す
    const cast001 = result.casts.find((cast) => cast.id === 'seed-user-cast-001')

    expect(cast001).toBeDefined()
    expect(cast001?.name).toBe('山田花子')
    expect(cast001?.areaName).toBe('渋谷')
  })
})
```

#### 新規データを作成するテスト

新規作成が必要なテスト（例: `registerProfile`）では、テスト用のプレフィックス `test-{service}-*` を使用し、テスト後にクリーンアップします。

```typescript
const TEST_PREFIX = 'test-user-service-'

async function cleanupTestData() {
  // TEST_PREFIXで始まるデータを削除
  const testUsers = await db.select({ id: users.id }).from(users)
  const testUserIds = testUsers.filter((u) => u.id.startsWith(TEST_PREFIX)).map((u) => u.id)

  for (const userId of testUserIds) {
    await db.delete(accounts).where(eq(accounts.userId, userId))
    await db.delete(userProfiles).where(eq(userProfiles.id, userId))
    await db.delete(users).where(eq(users.id, userId))
  }
}

describe('registerProfile', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  it('プロフィールを作成してロールを更新する', async () => {
    // テスト用ユーザーを作成
    const [user] = await db.insert(users).values({
      id: `${TEST_PREFIX}register-001`,
      email: 'register-001@test.example.com',
      emailVerified: null,
    }).returning()

    // テスト実行
    const result = await userService.registerProfile(user.id, {
      name: '新規ユーザー',
      birthDate: '1995-05-15',
      userType: 'guest',
    })

    expect(result.name).toBe('新規ユーザー')
  })
})
```

## テスト実行コマンド

```bash
# ブラウザ環境テスト（Unit + Integration）
npm run test

# Node.js環境テスト（DB操作テスト）
npm run test:node

# すべてのテスト
npm run test:all

# E2E テスト
npm run test:e2e

# ウォッチモード
npm run test -- --watch

# カバレッジ
npm run test -- --coverage
```

### Node.js環境テストの前提条件

service層のテストなど、Node.js環境で実行するテストは実際のデータベースに接続します。

**実行前に必ずローカルSupabaseを起動してください:**

```bash
# Supabaseディレクトリに移動
cd supabase

# Supabaseを起動
supabase start

# テストデータをリセット
supabase db reset
```

## テストデータのライフサイクル

### 開発フロー

1. **開発開始時**: `supabase db reset`でデータベースを初期化
2. **テスト実行**: seed.sqlのデータを使用してテスト
3. **マイグレーション変更時**: 再度`supabase db reset`を実行
4. **seed.sqlの更新**: テストパターンに応じてseed.sqlを追加・修正

### seed.sqlの更新が必要なケース

以下の場合、seed.sqlの更新を検討してください:

- 新しいテストパターンが追加された
- 既存のテストで新しいエッジケースをカバーする必要がある
- テストコードで頻繁にデータ作成が行われている

## ベストプラクティス

### ✅ すべきこと

- seed.sqlのデータを積極的に活用する
- テストは独立して実行可能にする
- エラーケースのテストも書く
- テスト名は日本語で書く（ビジネス要件が明確になる）

### ❌ すべきでないこと

- seed.sqlのデータを変更・削除するテストを書かない
- テスト間で共有される可変状態を作らない
- テストの実行順序に依存したテストを書かない
- 本番データを使ったテストを行わない

## トラブルシューティング

### Q: テストでseed.sqlのデータが見つからない

**A:** `supabase db reset`を実行してseed.sqlを適用してください。

```bash
cd supabase
supabase db reset
```

### Q: テストが失敗する（外部キー制約エラー）

**A:** データの削除順序を確認してください。外部キー制約があるため、以下の順序で削除します:

1. accounts
2. cast_profiles / userProfiles
3. users

### Q: seed.sqlに新しいデータを追加したい

**A:** `supabase/seed.sql`を編集し、命名規則に従ってデータを追加してください。その後、`supabase db reset`で適用します。

### Q: seed.sqlのデータがテスト実行中に変更されてしまう

**A:** seed.sqlのデータは変更せず、新規作成するテストでは`test-*`プレフィックスを使用してクリーンアップしてください。
