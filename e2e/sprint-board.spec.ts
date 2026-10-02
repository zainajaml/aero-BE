import { createTicket, expect, test, uniqueId } from "./support/fixtures";

test("plan a sprint, start it and move the ticket across the board", async ({
  page,
  workspace,
}) => {
  const id = uniqueId();
  const sprintName = `Sprint ${id.slice(-6)}`;
  const title = `Calibrate the gyroscope ${id}`;
  const ticket = await createTicket(page, workspace.projectId, title);

  await page.goto("/backlog");
  await expect(
    page.getByRole("button", { name: new RegExp(`${ticket.code} ${title}$`) }),
  ).toBeVisible();

  // Create the sprint.
  await page.getByRole("button", { name: "Sprint", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New sprint" });
  await dialog.getByLabel("Name").fill(sprintName);
  await dialog.getByLabel("Goal").fill("Stabilise attitude control");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: sprintName })).toBeVisible();

  // Move the ticket into it with the selection bar (the keyboard-friendly alternative to a drag).
  await page.getByRole("button", { name: new RegExp(`${ticket.code} ${title}$`) }).hover();
  await page.getByRole("checkbox", { name: "Select ticket" }).click();
  await page.getByRole("combobox", { name: "Move selected tickets to" }).click();
  await page.getByRole("option", { name: sprintName }).click();
  await expect(page.getByText("All tickets assigned to sprints.")).toBeVisible();

  // Start it.
  await page.getByRole("button", { name: "Start sprint" }).click();
  await expect(page.getByRole("button", { name: "Complete sprint" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("All tickets assigned to sprints.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete sprint" })).toBeVisible();

  // On the board, drag the card from Backlog to In Progress.
  await page.getByRole("link", { name: "Sprint Board" }).click();
  await expect(page.getByText(`Currently Viewing Sprint(s) - ${sprintName}`)).toBeVisible();
  const from = page.getByRole("region", { name: "Backlog" });
  const to = page.getByRole("region", { name: "In Progress" });
  const card = from.getByText(title);
  await expect(card).toBeVisible();

  const cardBox = (await card.boundingBox())!;
  const toBox = (await to.boundingBox())!;
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cardBox.x + cardBox.width / 2 + 20, cardBox.y + cardBox.height / 2, {
    steps: 5,
  });
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 3, { steps: 15 });
  await page.mouse.up();

  await expect(to.getByText(title)).toBeVisible();
  await expect(from.getByText("Empty")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("region", { name: "In Progress" }).getByText(title)).toBeVisible();
  await expect(page.getByRole("region", { name: "Backlog" }).getByText("Empty")).toBeVisible();
});
