import { randomBytes } from "node:crypto";
import { expect, request, test as base, type APIRequestContext, type Page } from "@playwright/test";
import { linkFromLatestEmail } from "../mailpit";

export const PASSWORD = "e2e-password-123";

/** A short random token: unique per run and per test, so journeys never share data. */
export function uniqueId(): string {
  return `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
}

/** Same-origin header for state-changing calls (better-auth and the API check Origin). */
function originHeaders(baseURL: string) {
  return { Origin: new URL(baseURL).origin };
}

export type User = { email: string; firstName: string; lastName: string; password: string };

export type Workspace = {
  user: User;
  accountId: string;
  accountName: string;
  projectId: string;
  projectName: string;
  projectKey: string;
};

async function json<T>(response: Awaited<ReturnType<APIRequestContext["get"]>>): Promise<T> {
  const body = await response.text();
  expect(response.ok(), `${response.url()} -> ${response.status()} ${body}`).toBeTruthy();
  return (JSON.parse(body) as { data: T }).data;
}

/**
 * Signs a new user up through the API and verifies the email through the Mailpit link. The request
 * context keeps the session cookie, so with `page.request` the page is signed in afterwards.
 */
export async function signUpVerified(
  request: APIRequestContext,
  baseURL: string,
  opts: { email?: string; firstName?: string; lastName?: string } = {},
): Promise<User> {
  const id = uniqueId();
  const user: User = {
    email: opts.email ?? `e2e-${id}@example.com`,
    firstName: opts.firstName ?? "Eve",
    lastName: opts.lastName ?? `Tester${id.slice(-4)}`,
    password: PASSWORD,
  };
  const signUp = await request.post("/api/auth/sign-up/email", {
    headers: originHeaders(baseURL),
    data: {
      email: user.email,
      password: user.password,
      name: `${user.firstName} ${user.lastName}`,
      callbackURL: new URL("/onboarding", baseURL).toString(),
    },
  });
  expect(signUp.ok(), await signUp.text()).toBeTruthy();
  const link = await linkFromLatestEmail(user.email, "verify-email");
  const verify = await request.get(link, { maxRedirects: 0 });
  expect(verify.status(), "verification link redirects into the app").toBe(302);
  return user;
}

/** Runs the onboarding API steps: workspace, then the first project (sprint board by default). */
export async function onboard(
  request: APIRequestContext,
  baseURL: string,
  user: User,
  projectType: "sprint" | "kanban" = "sprint",
): Promise<Omit<Workspace, "user">> {
  const id = uniqueId();
  const accountName = `E2E Workspace ${id}`;
  const { accountId } = await json<{ accountId: string }>(
    await request.post("/api/v1/onboarding/workspace", {
      headers: originHeaders(baseURL),
      data: { name: accountName, firstName: user.firstName, lastName: user.lastName },
    }),
  );
  const projectName = `Launch ${id.slice(-5)}`;
  const projectKey = `E${id
    .slice(-5)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "X")}`;
  const { projectId } = await json<{ projectId: string }>(
    await request.post("/api/v1/onboarding/first-project", {
      headers: originHeaders(baseURL),
      data: { accountId, name: projectName, key: projectKey, projectType },
    }),
  );
  return { accountId, accountName, projectId, projectName, projectKey };
}

/** A JSON API call with the page's session (for fixture shortcuts only). */
export async function apiPost<T>(page: Page, path: string, data: unknown): Promise<T> {
  return json<T>(
    await page.request.post(path, { headers: originHeaders(testBaseURL()), data: data as object }),
  );
}

export async function apiPatch<T>(page: Page, path: string, data: unknown): Promise<T> {
  return json<T>(
    await page.request.patch(path, { headers: originHeaders(testBaseURL()), data: data as object }),
  );
}

export async function apiGet<T>(page: Page, path: string): Promise<T> {
  return json<T>(await page.request.get(path));
}

/** Creates a backlog ticket through the API (a shortcut for journeys that are not about creation). */
export async function createTicket(
  page: Page,
  projectId: string,
  title: string,
): Promise<{ id: string; code: string }> {
  return apiPost(page, `/api/v1/projects/${projectId}/tickets`, {
    title,
    type: "task",
    priority: "medium",
    descriptionJson: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Created by a fixture." }] }],
    },
  });
}

/**
 * Adds a member to the workspace's project: the admin (signed in on `page`) invites them through the
 * API and they set a password through the public accept endpoint, as the accept page would.
 */
export async function addMember(
  page: Page,
  workspace: Workspace,
  role: "developer" | "team" | "viewer" | "admin",
  name = { firstName: "Dana", lastName: "Dev" },
): Promise<User & { userId: string }> {
  const email = `e2e-${role}-${uniqueId()}@example.com`;
  await apiPost(page, "/api/v1/invitations", {
    email,
    role,
    projectIds: [workspace.projectId],
    accountIds: [],
    jobTitle: null,
  });
  const token = new URL(await linkFromLatestEmail(email, "/accept")).searchParams.get("token");
  const anonymous = await request.newContext({ baseURL: testBaseURL() });
  try {
    await json(
      await anonymous.post("/api/v1/invitations/accept-with-password", {
        headers: originHeaders(testBaseURL()),
        data: { token, password: PASSWORD, ...name },
      }),
    );
  } finally {
    await anonymous.dispose();
  }
  const people = await apiGet<
    { userId: string; email?: string | null; firstName?: string | null }[]
  >(page, `/api/v1/projects/${workspace.projectId}/people`);
  const member = people.find((p) => p.firstName === name.firstName);
  expect(member, `${email} is a project member`).toBeTruthy();
  return { email, password: PASSWORD, ...name, userId: member!.userId };
}

function testBaseURL(): string {
  return process.env.E2E_BASE_URL ?? "http://localhost:5173";
}

/**
 * `workspace`: a freshly signed-up, verified and onboarded account admin with one project. The
 * `page` is signed in as that user (cookies are shared between `page.request` and the browser).
 */
export const test = base.extend<{ workspace: Workspace }>({
  workspace: async ({ page, baseURL }, provide) => {
    const url = baseURL ?? testBaseURL();
    const user = await signUpVerified(page.request, url);
    const ws = await onboard(page.request, url, user);
    await provide({ user, ...ws });
  },
});

export { expect };
