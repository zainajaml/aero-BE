import { expect, test, uniqueId } from "./support/fixtures";

test("create a folder and a page, write content, save and see it after a reload", async ({
  page,
  workspace,
}) => {
  const id = uniqueId();
  const folder = `Flight manuals ${id}`;
  const pageTitle = `Pre-launch checklist ${id}`;
  const body = `Arm the range safety system before T-minus 10 (${id}).`;

  await page.goto("/documents");
  await expect(page.getByText(`Pages and files for ${workspace.projectName}.`)).toBeVisible();

  // A new folder starts in rename mode.
  await page.getByRole("button", { name: "Folder", exact: true }).click();
  const folderName = page.getByRole("textbox", { name: "Folder name" });
  await folderName.fill(folder);
  await folderName.press("Enter");
  const folderButton = page.getByRole("button", { name: folder, exact: true });
  await expect(folderButton).toBeVisible();

  // Add a page inside it, title it and write the body.
  await folderButton.hover();
  await page.getByRole("button", { name: "Add page to folder" }).click();
  const title = page.getByRole("textbox", { name: "Page title" });
  await expect(title).toBeEditable();
  await title.fill(pageTitle);
  const content = page.getByRole("textbox", { name: "Page content" });
  await content.click();
  await content.pressSequentially(body);
  await page.getByRole("button", { name: "Save Document" }).click();
  await expect(page.getByRole("button", { name: "Save Document" })).toBeDisabled();
  await expect(page.getByRole("button", { name: pageTitle })).toBeVisible();

  // After a reload the folder (open by default) holds the page with the saved content.
  await page.reload();
  await expect(page.getByRole("button", { name: "Collapse folder" })).toBeVisible();
  await page.getByRole("button", { name: pageTitle }).click();
  await expect(page.getByRole("textbox", { name: "Page title" })).toHaveValue(pageTitle);
  await expect(page.getByRole("textbox", { name: "Page content" })).toContainText(body);
});
