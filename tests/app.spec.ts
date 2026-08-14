import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";

// 静的アプリなのでサーバ不要。kojo の visualGate と同じ file:// 方式で開く
const APP_URL = pathToFileURL("public/index.html").href;

test("ページがロードできページエラーが出ない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(APP_URL);
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});

// このスモークは削除しないこと。機能テストは PLAN.md の受け入れ条件ごとに追記する

const TIME_RE = /^\d+:\d{2}\.\d{2}$/;

async function openApp(page: import("@playwright/test").Page) {
  await page.clock.install();
  await page.goto(APP_URL);
}

test("初期表示では経過時間が00:00.00・ラップ空・開始可能", async ({ page }) => {
  await openApp(page);

  await expect(page.getByTestId("display")).toHaveText("00:00.00");
  await expect(page.getByTestId("laps").locator("li")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "開始" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "ラップ" })).toBeDisabled();
});

test("開始すると1/100秒単位でカウントアップしMM:SS.cc形式で表示する", async ({
  page,
}) => {
  await openApp(page);

  await page.getByRole("button", { name: "開始" }).click();
  await page.clock.fastForward(1230);

  const text = await page.getByTestId("display").innerText();
  expect(text).toMatch(TIME_RE);
  expect(text).not.toBe("00:00.00");
  // 1/100秒桁まで含み、進んだ時間が反映されていること
  expect(text).toBe("00:01.23");
});

test("停止するとカウントアップが止まる", async ({ page }) => {
  await openApp(page);

  await page.getByRole("button", { name: "開始" }).click();
  await page.clock.fastForward(1500);
  await page.getByRole("button", { name: "停止" }).click();

  const stopped = await page.getByTestId("display").innerText();
  expect(stopped).toMatch(TIME_RE);
  expect(stopped).not.toBe("00:00.00");

  await page.clock.fastForward(2000);
  await expect(page.getByTestId("display")).toHaveText(stopped);
});

test("停止後の開始は停止時点から再開する", async ({ page }) => {
  await openApp(page);

  await page.getByRole("button", { name: "開始" }).click();
  await page.clock.fastForward(2000);
  await page.getByRole("button", { name: "停止" }).click();
  const stopped = await page.getByTestId("display").innerText();
  expect(stopped).toMatch(TIME_RE);

  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByTestId("display")).toHaveText(stopped);

  await page.clock.fastForward(500);
  const resumed = await page.getByTestId("display").innerText();
  expect(resumed).toMatch(TIME_RE);
  expect(resumed).not.toBe(stopped);
});

test("計測中のラップで経過時間が番号付きで一覧に追加される", async ({
  page,
}) => {
  await openApp(page);

  await page.getByRole("button", { name: "開始" }).click();
  await page.clock.fastForward(1000);

  // 押下と表示値の読み取りを同一同期ブロックにし、仮想時計の進行ズレを避ける
  const first = await page.evaluate(() => {
    const before = document.querySelector('[data-testid="display"]')!.textContent!;
    (document.getElementById("lap") as HTMLButtonElement).click();
    const row = document.querySelector('[data-testid="laps"] li')!;
    return {
      before,
      num: row.querySelector('[data-testid="lap-num"]')!.textContent!,
      time: row.querySelector('[data-testid="lap-time"]')!.textContent!,
    };
  });
  expect(first.before).toMatch(TIME_RE);
  expect(first.num).toBe("1");
  expect(first.time).toBe(first.before);

  const rows = page.getByTestId("laps").locator("li");
  await expect(rows).toHaveCount(1);

  await page.clock.fastForward(500);
  const second = await page.evaluate(() => {
    const before = document.querySelector('[data-testid="display"]')!.textContent!;
    (document.getElementById("lap") as HTMLButtonElement).click();
    const row = document.querySelector('[data-testid="laps"] li')!;
    return {
      before,
      num: row.querySelector('[data-testid="lap-num"]')!.textContent!,
      time: row.querySelector('[data-testid="lap-time"]')!.textContent!,
    };
  });
  expect(second.num).toBe("2");
  expect(second.time).toBe(second.before);
  expect(second.time).not.toBe(first.time);
  await expect(rows).toHaveCount(2);
});

test("リセットで表示・ラップがクリアされ停止状態になる", async ({ page }) => {
  await openApp(page);

  // 計測中からのリセット
  await page.getByRole("button", { name: "開始" }).click();
  await page.clock.fastForward(1000);
  await page.getByRole("button", { name: "ラップ" }).click();
  await page.getByRole("button", { name: "リセット" }).click();

  await expect(page.getByTestId("display")).toHaveText("00:00.00");
  await expect(page.getByTestId("laps").locator("li")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "開始" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "ラップ" })).toBeDisabled();

  // 停止中からのリセット
  await page.getByRole("button", { name: "開始" }).click();
  await page.clock.fastForward(800);
  await page.getByRole("button", { name: "停止" }).click();
  await page.getByRole("button", { name: "リセット" }).click();

  await expect(page.getByTestId("display")).toHaveText("00:00.00");
  await expect(page.getByTestId("laps").locator("li")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "開始" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "ラップ" })).toBeDisabled();
});

test("SEO: meta description が空でない", async ({ page }) => {
  await page.goto(APP_URL);
  const content = await page.locator('meta[name="description"]').getAttribute("content");
  expect(content).toBeTruthy();
  expect(content!.trim().length).toBeGreaterThan(0);
});

test("SEO: JSON-LD WebApplication に必須フィールドがある", async ({ page }) => {
  await page.goto(APP_URL);

  const nodes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => {
    const collected: Record<string, unknown>[] = [];
    for (const script of scripts) {
      const parsed = JSON.parse(script.textContent || "null");
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item && typeof item === "object") collected.push(item as Record<string, unknown>);
      }
    }
    return collected;
  });

  const webApp = nodes.find((n) => {
    const t = n["@type"];
    return t === "WebApplication" || (Array.isArray(t) && t.includes("WebApplication"));
  });
  expect(webApp).toBeTruthy();
  expect(webApp!.name).toBeTruthy();
  expect(webApp!.description).toBeTruthy();
  expect(webApp!.url).toBeTruthy();
  expect(webApp!.applicationCategory).toBeTruthy();
  const offers = webApp!.offers as { price?: string } | undefined;
  expect(offers?.price).toBe("0");
});

test("SEO: 使い方と FAQ セクションが DOM 上にある", async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.locator("#how-to")).toBeVisible();
  await expect(page.locator("#faq")).toBeVisible();
});
