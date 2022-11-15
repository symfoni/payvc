import { test, expect, Page } from "@playwright/test";

const TEST_USER_EMAIL = "robin@payvc.xyz";

const login = async (page: Page) => {
	await page.locator("#sign-in").click();

	const singInButton = await page.locator('button:has-text("Sign in with TEST EMAIL")');

	await expect(singInButton).toBeVisible();

	await page.getByLabel("Email [TEST]").fill(TEST_USER_EMAIL);

	await singInButton.click();
};

test("see account after login", async ({ page, baseURL }) => {
	await page.goto(`${baseURL}/account`);
	await expect(page.locator("text=You are not logged inn")).toBeVisible();

	await login(page);

	await expect(page.getByLabel("Email")).toHaveValue(TEST_USER_EMAIL);
	await expect(page.getByLabel("Name")).toBeVisible();
	await expect(page.locator("text=Roles")).toBeVisible();
});
