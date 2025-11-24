# 開発コマンド一覧

## 開発サーバー
```bash
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
```

## テスト
```bash
cd frontend
npm run test         # Vitest (ブラウザ環境)
npm run test:node    # Vitest (Node.js環境、DB操作、APIテスト)
npm run test:e2e     # Playwright E2Eテスト
```

## リント・フォーマット
```bash
cd frontend
npm run lint         # ESLint実行
```

## データベース (Drizzle)
```bash
cd frontend
npm run db:generate  # マイグレーションファイル生成
npm run db:migrate   # マイグレーション実行
npm run db:push      # スキーマをDBにプッシュ
npm run db:studio    # Drizzle Studio起動
```

## Supabase
```bash
cd supabase
supabase start       # ローカルSupabase起動
supabase stop        # ローカルSupabase停止
```

## Git
```bash
git status           # 状態確認
git add .            # ステージング
git commit -m "msg"  # コミット
git push             # プッシュ
```

## GitHub CLI
```bash
gh issue list        # Issue一覧
gh pr create         # PR作成
gh pr list           # PR一覧
```
