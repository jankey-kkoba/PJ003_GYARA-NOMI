# プロジェクト概要

## プロジェクト名
PJ003_GYARA-NOMI（ギャラ飲みプラットフォーム）

## 目的
「ギャラ飲み」プラットフォームアプリケーション。キャスト（女性）とゲスト（男性）をマッチングし、飲み会を実現するサービス。

## 主要機能
- LINEログイン（LINE認証による会員登録・ログイン）
- ソロマッチング（1対1のギャラ飲み）
- グループマッチング（複数キャストを呼べる）
- チャット（ゲストとキャスト間）

## アクター
- **キャスト**: 料金をもらいゲストと飲み会をする女性ユーザー
- **ゲスト**: 料金を払いキャストと飲み会をする男性ユーザー
- **管理者**: 通報対応やマスタ管理を行う

## 技術スタック
- **Frontend**: Next.js 16 (App Router), React 19
- **Hosting**: Vercel
- **Backend**: Supabase
- **Auth**: Auth.js (next-auth v5)
- **ORM**: Drizzle
- **Test**: Vitest, Playwright
- **UI**: TailwindCSS v4, Radix UI, shadcn/ui
- **State**: Tanstack Query
- **API**: Hono

## ディレクトリ構造
```
/
├── frontend/          # Next.jsアプリケーション
│   ├── src/
│   │   ├── app/       # App Router
│   │   ├── features/  # ドメイン別機能
│   │   ├── components/# 共通コンポーネント
│   │   ├── hooks/     # 共通hooks
│   │   ├── libs/      # ライブラリラッパー
│   │   ├── utils/     # ユーティリティ
│   │   └── types/     # 型定義
│   └── __tests__/     # テストファイル
├── supabase/          # Supabase設定・マイグレーション
├── docs/              # ドキュメント
└── .github/           # GitHub設定
```
