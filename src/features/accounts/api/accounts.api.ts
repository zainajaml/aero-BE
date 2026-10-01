import { api, unwrap } from "@/shared/api/client";
import type { components } from "@/shared/api/schema.gen";

export type AdministeredAccount = components["schemas"]["AdministeredAccount"];
export type Person = components["schemas"]["Person"];

export const listAdministeredAccounts = () => unwrap(api.GET("/api/v1/accounts/administered"));
export const createAccount = (body: components["schemas"]["CreateAccountRequest"]) =>
  unwrap(api.POST("/api/v1/accounts", { body }));
export const updateAccount = (
  accountId: string,
  body: components["schemas"]["UpdateAccountRequest"],
) => unwrap(api.PATCH("/api/v1/accounts/{accountId}", { params: { path: { accountId } }, body }));
/** Without `force` the server refuses (409) while the account still has projects. */
export const deleteAccount = (accountId: string, force = false) =>
  unwrap(
    api.DELETE("/api/v1/accounts/{accountId}", {
      params: { path: { accountId }, query: { force: force ? "true" : "false" } },
    }),
  );
/** Names for the given users (limited server-side to people the caller shares a project/account with). */
export const listVisiblePeople = (ids: string[]) =>
  unwrap(api.GET("/api/v1/people", { params: { query: { ids: ids.join(",") } } }));
