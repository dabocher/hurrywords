import { expect, test } from "@playwright/test";

test("home page loads and renders the main heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
