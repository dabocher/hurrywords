import { expect, test } from "@playwright/test";

test("nav-games links navigate without 404", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a", { hasText: "Palabras del día" })).toBeVisible();
    await expect(page.locator("a", { hasText: "Palabrejas" })).toBeVisible();

    await page.click('a[href="/palabrejas"]');

    await page.waitForURL("/palabrejas");
    await expect(page.locator("h1", { hasText: /Palabrejas/i })).toBeVisible();

    await page.click('a[href="/daily-words"]');
    await page.waitForURL("/daily-words");
    await expect(page.locator("h1", { hasText: /Palabras del día/i })).toBeVisible();
});
