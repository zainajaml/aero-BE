import { linkFromLatestEmail } from "./mailpit";
import {
  addMember,
  apiPatch,
  apiPost,
  createTicket,
  expect,
  test,
  uniqueId,
} from "./support/fixtures";

test("open a support issue from the widget and send a message", async ({ page, workspace }) => {
  const id = uniqueId();
  const subject = `Board will not load ${id}`;
  const message = `It happens after switching projects (${id}).`;
  void workspace;

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Support" }).click();
  const support = page.getByRole("dialog", { name: "Support" });
  await support.getByRole("button", { name: "New issue" }).click();
  await support.getByLabel("Title").fill(subject);
  await support.getByRole("textbox", { name: "Description" }).fill("Spinner never stops.");
  await support.getByRole("button", { name: "Create Ticket" }).click();

  // The new issue opens its conversation; send a follow-up message.
  await expect(support.getByRole("heading", { name: subject })).toBeVisible();
  await support.getByRole("textbox", { name: "Message" }).fill(message);
  await support.getByRole("button", { name: "Send message" }).click();
  await expect(support.getByText(message)).toBeVisible();

  // Both survive a reload.
  await page.reload();
  await page.getByRole("button", { name: "Support" }).click();
  await page
    .getByRole("dialog", { name: "Support" })
    .getByRole("button", { name: new RegExp(subject) })
    .click();
  await expect(page.getByRole("dialog", { name: "Support" }).getByText(message)).toBeVisible();
});

test("the notifications page lists sent emails, such as a ticket assignment", async ({
  page,
  workspace,
}) => {
  const id = uniqueId();
  const member = await addMember(page, workspace, "developer");
  const ticket = await createTicket(page, workspace.projectId, `Refuel the lander ${id}`);
  await apiPatch(page, `/api/v1/tickets/${ticket.id}`, { assigneeId: member.userId });
  // The email is sent (and logged) after the API answers; wait until it reaches the inbox.
  await linkFromLatestEmail(member.email, "/ticket/");

  await page.goto("/notifications");
  const row = page.getByRole("row", { name: new RegExp(ticket.code) });
  await expect(async () => {
    await page.reload();
    await expect(row).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await expect(
    row.getByRole("cell", { name: `Eve ${workspace.user.lastName}`, exact: true }),
  ).toBeVisible();
  await expect(row.getByRole("cell", { name: "Sent" })).toBeVisible();

  // The free-text filter narrows the log on the server.
  await page.getByRole("textbox", { name: /Filter by type/ }).fill(ticket.code);
  await expect(page.getByText("1–1 / 1")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2);
  await expect(row).toBeVisible();
});

// Backend bug: invitation emails store `project_ids` (array) in their log metadata, while
// GET /api/v1/notifications?projectId=… filters on `project_id`, so a project's invitations never
// appear in its notification log (the page always passes the active project). Remove `test.fail`
// once the backend is fixed.
test("the notifications page lists the invitations sent for the project", async ({
  page,
  workspace,
}) => {
  test.fail();
  const invitee = `e2e-invitee-${uniqueId()}@example.com`;
  await apiPost(page, "/api/v1/invitations", {
    email: invitee,
    role: "developer",
    projectIds: [workspace.projectId],
    accountIds: [],
    jobTitle: null,
  });
  await linkFromLatestEmail(invitee, "/accept");

  // Wait for the project-scoped query (the first render may still be unscoped).
  const scoped = page.waitForResponse(
    (r) => r.url().includes("/api/v1/notifications?") && r.url().includes("projectId="),
  );
  await page.goto("/notifications");
  await scoped;
  await expect(page.getByRole("row", { name: new RegExp(`${invitee} was invited`) })).toBeVisible({
    timeout: 3_000,
  });
});
