import type { Page } from "@playwright/test";
import { apiGet, expect, test, uniqueId } from "./support/fixtures";

/** The clickable title of a backlog row ("<type> <priority> <code> <title>"). */
const ticketRow = (page: Page, title: string) =>
  page.getByRole("button", { name: new RegExp(`-\\d+ ${title}$`) });

test("create a ticket, edit it, comment, log time, and open its deep link", async ({
  page,
  workspace,
}) => {
  const id = uniqueId();
  const title = `Wire the telemetry ${id}`;
  const renamed = `Wire the telemetry bus ${id}`;
  const comment = `Looks good to me ${id}`;
  const note = `Paired on the parser ${id}`;

  await page.goto("/backlog");
  await expect(page.getByRole("heading", { name: "Backlog & Sprints" })).toBeVisible();

  // Create from the backlog panel.
  await page.getByRole("button", { name: "Ticket", exact: true }).click();
  const create = page.getByRole("dialog", { name: "New ticket" });
  await create.getByLabel("Title").fill(title);
  await create.getByRole("textbox", { name: "Description" }).fill("Stream frames to the hub.");
  await create.getByRole("button", { name: "Save Ticket" }).click();
  await expect(create).toBeHidden();

  // Open it from its backlog row.
  await ticketRow(page, title).click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog.getByLabel("Title")).toHaveValue(title);
  const code = (await dialog
    .getByText(new RegExp(`^${workspace.projectKey}-\\d+$`))
    .textContent())!;

  // Rename and save (the dialog closes on save).
  await dialog.getByLabel("Title").fill(renamed);
  await dialog.getByRole("button", { name: "Save Ticket" }).click();
  await expect(dialog).toBeHidden();
  await expect(ticketRow(page, renamed)).toBeVisible();

  // Comment.
  await ticketRow(page, renamed).click();
  const reopened = page.getByRole("dialog", { name: renamed });
  await reopened.getByRole("button", { name: /^Comments/ }).click();
  await reopened.getByRole("textbox", { name: "Comment" }).fill(comment);
  await reopened.getByRole("button", { name: "Add Comment" }).click();
  await expect(reopened.getByText(comment)).toBeVisible();

  // Log 1h 30m of work.
  await reopened.getByRole("button", { name: /^Estimates and Work Logs/ }).click();
  await reopened.getByRole("button", { name: "Add Work Log" }).click();
  await reopened.getByLabel("What did you work on?").fill(note);
  await reopened.getByLabel("Time start").fill("9:00 am");
  await reopened.getByLabel("Time start").press("Enter");
  await reopened.getByLabel("Time stop").fill("10:30 am");
  await reopened.getByLabel("Time stop").press("Enter");
  await reopened.getByRole("button", { name: "Add Log" }).click();
  await expect(reopened.getByText(note)).toBeVisible();

  // Everything survives a reload.
  await page.reload();
  await ticketRow(page, renamed).click();
  const afterReload = page.getByRole("dialog", { name: renamed });
  await expect(afterReload.getByLabel("Title")).toHaveValue(renamed);
  await afterReload.getByRole("button", { name: /^Comments/ }).click();
  await expect(afterReload.getByText(comment)).toBeVisible();
  await afterReload.getByRole("button", { name: /^Estimates and Work Logs/ }).click();
  await expect(afterReload.getByText(note)).toBeVisible();
  await expect(afterReload.getByText("1h 30m").first()).toBeVisible();
  await afterReload.getByRole("button", { name: "Close" }).click();

  // The deep link opens the same ticket over the app shell.
  const tickets = await apiGet<{ id: string; code: string }[]>(
    page,
    `/api/v1/projects/${workspace.projectId}/tickets`,
  );
  const ticketId = tickets.find((t) => t.code === code)?.id;
  expect(ticketId).toBeTruthy();
  await page.goto(`/ticket/${ticketId}`);
  const direct = page.getByRole("dialog", { name: renamed });
  await expect(direct.getByLabel("Title")).toHaveValue(renamed);
  await expect(direct.getByText(code, { exact: true })).toBeVisible();
});
