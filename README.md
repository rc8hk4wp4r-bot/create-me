# Active Guidance OS (MVP)

Desktop-first / Minimal UI / 1日1提案 / Recovery設計 を核にした習慣OSのMVPです。  
このリポジトリでは **Milestone 0〜2**（基盤、データモデル、Home最小体験）まで実装しています。

## 実装済みスコープ
- 3画面構成
  - Home: Proposal Card + Quick Logger + Mini Band
  - History: 90日Band（簡易表示）+ Heatmapプレースホルダ
  - Settings: Status/If-Then/Billingプレースホルダ
- 1日1提案ルールエンジン（Growth/Maintenance/Recovery）
- Accept / Downgrade（再交渉）
- キーボード操作
  - `1..5`: 完了トグル
  - `Shift+1..5`: 強度S→M→L
  - `P`: 提案Accept
  - `D`: 提案Downgrade
- Supabase向けのSQL migration + RLS定義
- zodバリデーション

## 技術スタック
- Next.js (App Router) + TypeScript strict
- TailwindCSS
- Supabase（将来接続用）
- zod

## ローカル起動
```bash
npm install
npm run dev
```

`http://localhost:3000` を開いてください。

## 環境変数
`.env.example` を `.env.local` にコピー。

```bash
cp .env.example .env.local
```

現状（Milestone 0〜2）は、未設定でも動くように **ローカルデモストア (`.demo-data.json`)** を使用します。  
Supabase本番接続・Auth・Billingは Milestone 3以降で有効化します。

## Supabase
マイグレーション:
- `supabase/migrations/0001_init.sql`

含まれるテーブル:
- profiles
- habits
- daily_logs
- proposals
- if_then_plans
- billing_customers

各テーブルに `user_id = auth.uid()` ベースのRLSポリシーを定義。

## 仮置き前提（このMVPで固定）
- 料金表示: Pro 月額 ¥980（仮）、Lifetime ¥12,000（仮）
- 初期習慣（5件）: 深作業 / ストレッチ / 読書 / 振り返り / 散歩
- タイムゾーン: Asia/Tokyo

## ドキュメント
- `docs/mvp-guide.md`: 操作方法（キーボードショートカット含む）
