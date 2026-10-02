import { expect, test, uniqueId } from "./support/fixtures";

test("change name and timezone, and toggle a notification preference", async ({
  page,
  workspace,
  browser,
  baseURL,
}) => {
  const lastName = `Orbit${uniqueId().slice(-6)}`;
  const fullName = `Nova ${lastName}`;
  const sidebarProfile = (p = page) =>
    p.getByRole("complementary").getByRole("button", { name: /View profile$/ });

  await page.goto("/profile");
  await expect(sidebarProfile()).toContainText(`Eve ${workspace.user.lastName}`);

  // Personal details: the sidebar follows the new name.
  await page.getByRole("button", { name: "Edit Personal details" }).click();
  await page.getByRole("textbox", { name: "First name" }).fill("Nova");
  await page.getByRole("textbox", { name: "Last name" }).fill(lastName);
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByRole("textbox", { name: "First name" })).toBeDisabled();
  await expect(sidebarProfile()).toContainText(fullName);

  // Work & reporting: timezone.
  await page.getByRole("button", { name: "Edit Work & reporting" }).click();
  await page.getByRole("combobox", { name: "Timezone" }).click();
  await page.getByRole("option", { name: "AEST (UTC+10)" }).click();
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByRole("combobox", { name: "Timezone" })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Timezone" })).toHaveText("AEST (UTC+10)");

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Last name" })).toHaveValue(lastName);
  await expect(page.getByRole("combobox", { name: "Timezone" })).toHaveText("AEST (UTC+10)");
  await expect(sidebarProfile()).toContainText(fullName);

  // Preferences: switches save instantly and survive a reload.
  await sidebarProfile().click();
  await page.getByRole("menuitem", { name: "Preferences" }).click();
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();
  const assigned = page.getByRole("switch", { name: "Ticket assigned" });
  await expect(assigned).toBeChecked();
  await assigned.click();
  await expect(assigned).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Ticket assigned" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Ticket unassigned" })).toBeChecked();

  // A fresh session (no local storage) gets the saved name and timezone from the server.
  const fresh = await browser.newContext({ baseURL });
  const other = await fresh.newPage();
  await other.goto("/login");
  await other.getByLabel("Email").fill(workspace.user.email);
  await other.getByLabel("Password", { exact: true }).fill(workspace.user.password);
  await other.getByRole("button", { name: "Sign in" }).click();
  await expect(other).toHaveURL(/\/dashboard/);
  await expect(sidebarProfile(other)).toContainText(fullName);
  await other.goto("/profile");
  await expect(other.getByRole("combobox", { name: "Timezone" })).toHaveText("AEST (UTC+10)");
  await fresh.close();
});
