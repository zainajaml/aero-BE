import { expect, test } from "@playwright/test";
import { linkFromLatestEmail } from "./mailpit";

const unique = Date.now().toString(36);
const email = `e2e-${unique}@example.com`;
const password = "e2e-password-123";

test("sign up, verify, onboard and land in the app", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("First name").fill("Eve");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  // The verification link goes to the API, which signs the user in and redirects to onboarding.
  await page.goto(await linkFromLatestEmail(email, "verify-email"));
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Account name").fill(`E2E Workspace ${unique}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Project name").fill("Launch Pad");
  await page.getByLabel("Project key").fill(
    `L${unique
      .slice(-6)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")}`,
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip this step" }).click();
  await page.getByRole("button", { name: "Go to Space Scope" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Launch Pad").first()).toBeVisible();
  await expect(page.getByText(`E2E Workspace ${unique}`).first()).toBeVisible();
});

test("signs out and back in; wrong password is rejected without detail", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toHaveText(/Incorrect email or password/);

  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("guards app routes for anonymous visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
