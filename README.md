# ストップウォッチ

経過時間を 1/100 秒（`MM:SS.cc`）で計測し、開始・停止・ラップ・リセットで操作する静的単一ページアプリ。計測中にラップを押すとその時点の経過時間が番号付きで一覧に追加され、停止後の再開は停止時点から続き、リセットですべて初期状態に戻る。状態はメモリ上のみで、ページを閉じると消える。

## 公開URL

https://stopwatch.jozo.beer

## 開発

[kojo](https://github.com/jozobeer/kojo)（1日1アプリ自動生成基盤）により生成されたリポジトリです。

初回セットアップ: `npm install`（Playwright ブラウザ未取得の環境では `npx playwright install chromium`）

- `npm test` — Playwright によるブラウザテスト
- `npm run verify` — 不変条件チェック（favicon / apps.jozo.beer フッター）
- `npm run deploy` — Cloudflare Workers へデプロイ

## 構成

- `public/index.html` — アプリ本体（CSS/JSインラインの単一ファイル）
- `tests/app.spec.ts` — 受け入れ条件を含む Playwright テスト（現状の正）
- `PLAN.md` — 初回実装時の計画（歴史的文書）
