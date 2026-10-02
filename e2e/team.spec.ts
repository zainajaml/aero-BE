import { linkFromLatestEmail } from "./mailpit";
import { createTicket, expect, PASSWORD, test, uniqueId } from "./support/fixtures";

test("an admin invites a viewer, who joins the project read-only", async ({
  page,
  workspace,
  browser,
  baseURL,
}) => {
  const id = uniqueId();
  const inviteeEmail = `e2e-viewer-${id}@example.com`;
  const title = `Inspect the heat shield ${id}`;
  await createTicket(page, workspace.projectId, title);

  // The admin sends the invitation from the admin page.
  await page.goto("/admin");
  await page.getByRole("tab", { name: "User Management" }).click();
  await page.getByRole("button", { name: "Invite user" }).click();
  const dialog = page.getByRole("dialog", { name: "Invite a user" });
  await dialog.getByLabel("Email").fill(inviteeEmail);
  await dialog.getByRole("combobox", { name: "Role" }).click();
  await page.getByRole("option", { name: "Viewer" }).click();
  await expect(dialog.getByText(workspace.projectName)).toBeVisible();
  await dialog.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText(`Invitation sent to ${inviteeEmail}`)).toBeVisible();
  await expect(dialog).toBeHidden();

  // The invitee follows the emailed link in a separate browser session.
  const invitee = await browser.newContext({ baseURL });
  const inviteePage = await invitee.newPage();
  await inviteePage.goto(await linkFromLatestEmail(inviteeEmail, "/accept"));
  await expect(
    inviteePage.getByRole("heading", { name: "You're invited to Space Scope" }),
  ).toBeVisible();
  await expect(inviteePage.getByText(workspace.projectName)).toBeVisible();
  await inviteePage.getByLabel("First name").fill("Vic");
  await inviteePage.getByLabel("Last name").fill("Viewer");
  await inviteePage.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await inviteePage.getByLabel("Confirm password").fill(PASSWORD);
  await inviteePage.getByRole("button", { name: "Create account & join" }).click();
  await expect(inviteePage).toHaveURL(/\/dashboard/);
  await expect(
    inviteePage.getByRole("button", { name: new RegExp(`^Project .*${workspace.projectName}`) }),
  ).toBeVisible();

  // Viewers see the backlog but are offered no create/edit affordances.
  await inviteePage.getByRole("link", { name: "Backlog" }).click();
  await expect(inviteePage.getByText(title)).toBeVisible();
  await expect(inviteePage.getByRole("heading", { name: "Backlog", level: 2 })).toBeVisible();
  await expect(inviteePage.getByRole("button", { name: "Ticket", exact: true })).toHaveCount(0);
  await expect(inviteePage.getByRole("button", { name: "Sprint", exact: true })).toHaveCount(0);
  await expect(inviteePage.getByRole("button", { name: "Epics" })).toHaveCount(0);
  await expect(inviteePage.getByRole("checkbox", { name: "Select ticket" })).toHaveCount(0);

  // The ticket opens read-only: no save, a read-only title and the view-only notice.
  await inviteePage.getByText(title).click();
  const ticket = inviteePage.getByRole("dialog", { name: title });
  await expect(ticket.getByLabel("Title")).toHaveAttribute("readonly", "");
  await expect(ticket.getByRole("button", { name: "Save Ticket" })).toHaveCount(0);
  await expect(ticket.getByText("You have view-only access").first()).toBeVisible();
  await expect(ticket.getByText(/part of a completed sprint/)).toHaveCount(0);

  // The admin sees the new member on the team list.
  await page.reload();
  await page.getByRole("tab", { name: "User Management" }).click();
  const row = page.getByRole("row", { name: new RegExp(inviteeEmail) });
  await expect(row.getByRole("cell", { name: "Viewer", exact: true }).first()).toBeVisible();
  await expect(row.getByRole("cell", { name: "Active" })).toBeVisible();

  await invitee.close();
});
