# ストップウォッチ

経過時間を 1/100 秒（`MM:SS.cc`）で計測する静的単一ページ Web アプリ。`public/index.html` に HTML / CSS / JS がすべてインラインで入っており、ビルドなしで動く。

## アプリ概要と構成

- **操作**: 開始/停止はトグルボタン1つ（計測中は「停止」、停止中は「開始」）。ラップは計測中のみ有効。リセットは計測中・停止中どちらでも可
- **表示**: 経過時間は `MM:SS.cc`（分は 60 以上でも桁を増やし、時への繰り上げなし）。ラップ一覧は番号 + 経過時間で、新しいものが上
- **計測**: `performance.now()` 基準の差分計算（`elapsedBefore` + 走行中の差分）。表示更新は約 16ms 間隔の `setInterval`。永続化なし
- **UI**: ダーク基調・中央寄せの縦一列。フッターに `apps.jozo.beer` への導線

主要ファイル:

- `public/index.html` — アプリ本体
- `tests/app.spec.ts` — 振る舞いの正（受け入れ条件のテスト）
- `PLAN.md` — 初回実装時の計画（歴史的文書。現状の仕様の正ではない）
- `wrangler.jsonc` — Cloudflare Workers assets 配信設定

現状の正は **README.md** と **`tests/app.spec.ts`** である。`PLAN.md` は初回実装の記録として残すだけで、仕様変更時に更新する必要はない。

## 技術スタック（不変）

- バニラJS・単一 `public/index.html`（CSS/JSインライン）・ビルドなし
- 配信: Cloudflare Workers assets（`wrangler.jsonc`）
- テスト: Playwright（`tests/app.spec.ts`、`npm test`）
- 保守時もこのスタックを維持すること。フレームワーク・ビルドツール・宣言外ライブラリの導入は禁止

## 品質不変条件

変更後も次を壊さないこと。変更後は `npm run verify` が通る状態を維持する。

- **favicon**: `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI（外部ファイル・外部 URL 不可）
- **フッター**: hub（apps.jozo.beer）への導線。リンク先 `https://apps.jozo.beer` とリンクテキスト `apps.jozo.beer` は変えない

  ```html
  <footer style="margin-top:3rem;text-align:center;font-size:.8rem;opacity:.6">
    <a href="https://apps.jozo.beer" style="color:inherit">apps.jozo.beer</a>
  </footer>
  ```

  スタイルはテーマに合わせて調整してよい。body が flex/grid のセンタリングの場合は `flex-direction: column` にするか、メインコンテナ末尾に置き、レイアウトを崩さないこと。

その他:

- 静的アプリ（`public/` 配下のみ）。サーバコード・外部 API・ビルドツールは使わない
- `public/index.html` を単一ファイルで完結させる
- 雛形のスモークテスト（ページロード）は削除しない
- README.md は削除しない
- apple-touch-icon / manifest / og-image / robots / sitemap は公開基盤が扱うため、このリポジトリでは書かない

## 保守の進め方

1. 変更したい振る舞いを受け入れ条件として `tests/app.spec.ts` に先に書く（または既存テストを更新する）
2. `public/index.html` を実装・修正する
3. `npm test` と `npm run verify` を通し、品質不変条件を満たすことを確認する
4. `git commit` し `git push` する
5. `npm run deploy` で Cloudflare Workers にデプロイする
