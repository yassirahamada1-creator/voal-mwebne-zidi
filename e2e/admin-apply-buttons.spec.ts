import { test, expect, Page } from "../playwright-fixture";

/**
 * E2E — verifies every "Appliquer" button in the admin Dashboard
 * actually persists the change and reflects it back in the UI.
 *
 * Tabs covered: Modules · Contenus · Galerie · Quiz · Traductions
 *
 * Authentication is bypassed via sessionStorage (AUTH_KEY = "admin_authed"),
 * matching the production guard in src/pages/Admin.tsx & Dashboard.tsx.
 */

const STAMP = () => Date.now().toString().slice(-8);

async function gotoDashboard(page: Page, tab?: string) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem("admin_authed", "1"); } catch {}
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Vue d'ensemble|Modules|Contenus|Galerie|Quiz|Traductions/ })).toBeVisible({ timeout: 15_000 });
  if (tab) {
    await page.getByRole("button", { name: new RegExp(`^${tab}$`, "i") }).click();
  }
}

async function expectToast(page: Page, re: RegExp) {
  await expect(page.locator("[data-sonner-toast], li[role='status']").filter({ hasText: re }).first()).toBeVisible({ timeout: 8_000 });
}

test.describe("Dashboard — boutons Appliquer", () => {
  test("Modules : créer puis supprimer via Appliquer", async ({ page }) => {
    const id = STAMP();
    const name = `E2E Module ${id}`;
    await gotoDashboard(page, "Modules");

    await page.getByRole("button", { name: /Nouveau module/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom (Français)").fill(name);
    await dialog.getByLabel("Nom (Shikomori)").fill(`${name} SHK`);
    await dialog.getByRole("button", { name: /^Appliquer$/ }).click();

    await expectToast(page, /Module appliqué/i);
    await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 10_000 });

    // cleanup
    page.once("dialog", (d) => d.accept());
    const row = page.getByRole("row", { name: new RegExp(name) });
    await row.getByRole("button", { name: /Supprimer/i }).click();
    await expect(page.getByRole("cell", { name })).toHaveCount(0, { timeout: 10_000 });
  });

  test("Contenus : créer puis supprimer via Appliquer", async ({ page }) => {
    const id = STAMP();
    const title = `E2E Contenu ${id}`;
    await gotoDashboard(page, "Contenus");

    await page.getByRole("button", { name: /Nouveau contenu/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Titre (FR)").fill(title);
    await dialog.getByLabel("Titre (Shikomori)").fill(`${title} SHK`);
    await dialog.getByRole("button", { name: /Appliquer à l'application/i }).click();

    await expectToast(page, /Contenu appliqué/i);
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 });

    page.once("dialog", (d) => d.accept());
    const row = page.getByRole("row").filter({ hasText: title });
    await row.getByRole("button", { name: /Supprimer/i }).click();
    await expect(page.getByText(title)).toHaveCount(0, { timeout: 10_000 });
  });

  test("Galerie : créer puis supprimer via Appliquer", async ({ page }) => {
    const id = STAMP();
    const caption = `E2E Photo ${id}`;
    await gotoDashboard(page, "Galerie");

    await page.getByRole("button", { name: /Nouvelle photo/i }).click();
    const dialog = page.getByRole("dialog");
    // MediaInput exposes a URL field — fill it directly.
    const urlInput = dialog.getByPlaceholder(/https?:\/\//i).first();
    await urlInput.fill("https://placehold.co/600x400.png");
    await dialog.getByLabel("Légende (FR)").fill(caption);
    await dialog.getByLabel("Légende (Shikomori)").fill(`${caption} SHK`);
    await dialog.getByRole("button", { name: /Appliquer à l'application/i }).click();

    await expectToast(page, /Photo appliquée/i);
    await expect(page.getByText(caption).first()).toBeVisible({ timeout: 10_000 });

    page.once("dialog", (d) => d.accept());
    const card = page.locator("div").filter({ hasText: new RegExp(`^${caption}`) }).first();
    await card.getByRole("button", { name: /Supprimer/i }).click();
    await expect(page.getByText(caption)).toHaveCount(0, { timeout: 10_000 });
  });

  test("Quiz : créer puis supprimer via Appliquer", async ({ page }) => {
    const id = STAMP();
    const question = `E2E Question ${id} ?`;
    await gotoDashboard(page, "Quiz");

    await page.getByRole("button", { name: /Nouvelle question/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Question (FR)").fill(question);
    await dialog.getByLabel("Question (Shikomori)").fill(`${question} SHK`);
    await dialog.getByLabel("Option A (FR)").fill("Réponse A");
    await dialog.getByLabel("Option A (Shk)").fill("Jibu A");
    await dialog.getByLabel("Option B (FR)").fill("Réponse B");
    await dialog.getByLabel("Option B (Shk)").fill("Jibu B");
    await dialog.getByRole("button", { name: /Appliquer à l'application/i }).click();

    await expectToast(page, /Question appliquée/i);
    await expect(page.getByText(question).first()).toBeVisible({ timeout: 10_000 });

    page.once("dialog", (d) => d.accept());
    const row = page.getByRole("row").filter({ hasText: question });
    await row.getByRole("button", { name: /Supprimer/i }).click();
    await expect(page.getByText(question)).toHaveCount(0, { timeout: 10_000 });
  });

  test("Traductions : Appliquer enregistre la modification puis on restaure", async ({ page }) => {
    await gotoDashboard(page, "Traductions");

    // Pick the first translation row, edit FR value, click Appliquer.
    const firstFr = page.getByLabel("Français").first();
    await expect(firstFr).toBeVisible({ timeout: 10_000 });
    const original = (await firstFr.inputValue()) || "";
    const edited = `${original}·E2E${STAMP()}`;

    await firstFr.fill(edited);

    // The Appliquer button only appears when dirty.
    const applyBtn = page.getByRole("button", { name: /^Appliquer$/ }).first();
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();

    await expectToast(page, /Modifications enregistrées/i);
    await expect(firstFr).toHaveValue(edited);

    // Restore original to keep DB clean.
    await firstFr.fill(original);
    await page.getByRole("button", { name: /^Appliquer$/ }).first().click();
    await expectToast(page, /Modifications enregistrées/i);
  });
});
