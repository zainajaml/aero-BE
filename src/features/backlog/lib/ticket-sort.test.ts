import { describe, expect, it } from "vitest";
import type { BacklogColumn, BacklogTicket } from "./backlog-types";
import { orderManualTickets, sortTickets } from "./ticket-sort";
import { activeFilterCount, EMPTY_FILTERS, matchesFilters } from "./backlog-filters";

const ticket = (over: Partial<BacklogTicket>): BacklogTicket =>
  ({
    id: over.code,
    title: "",
    priority: "medium",
    type: "task",
    columnId: null,
    assigneeId: null,
    reporterId: null,
    position: 0,
    ...over,
  }) as BacklogTicket;

const a = ticket({ code: "APP-10", title: "Beta", priority: "low", position: 2 });
const b = ticket({ code: "APP-2", title: "alpha", priority: "urgent", position: 1 });
const c = ticket({ code: "APP-3", title: "Gamma", priority: "high", position: 1 });
const none = new Map<string, string[]>();
const columns = new Map<string, BacklogColumn>();
const codes = (items: BacklogTicket[]) => items.map((t) => t.code);

describe("sortTickets", () => {
  it("sorts by ticket number numerically, not lexically", () => {
    expect(codes(sortTickets([a, b, c], "number", "asc", none, columns))).toEqual([
      "APP-2",
      "APP-3",
      "APP-10",
    ]);
  });

  it("sorts by priority and reverses for descending order", () => {
    expect(codes(sortTickets([a, b, c], "priority", "asc", none, columns))).toEqual([
      "APP-2",
      "APP-3",
      "APP-10",
    ]);
    expect(codes(sortTickets([a, b, c], "priority", "desc", none, columns))).toEqual([
      "APP-10",
      "APP-3",
      "APP-2",
    ]);
  });

  it("puts tickets without an epic last", () => {
    const epics = new Map([
      ["APP-3", ["Zeta"]],
      ["APP-2", ["Alpha", "Omega"]],
    ]);
    expect(codes(sortTickets([a, b, c], "epic", "asc", epics, columns))).toEqual([
      "APP-2",
      "APP-3",
      "APP-10",
    ]);
  });
});

describe("orderManualTickets", () => {
  it("orders by position, then code", () => {
    expect(codes(orderManualTickets([a, c, b]))).toEqual(["APP-2", "APP-3", "APP-10"]);
  });
});

describe("backlog filters", () => {
  it("matches search on title or code and the unassigned filter", () => {
    const assigned = ticket({ code: "APP-4", title: "Export", assigneeId: "u1" });
    expect(matchesFilters(assigned, { ...EMPTY_FILTERS, search: "app-4" })).toBe(true);
    expect(matchesFilters(assigned, { ...EMPTY_FILTERS, search: "import" })).toBe(false);
    expect(matchesFilters(assigned, { ...EMPTY_FILTERS, assignee: "__unassigned__" })).toBe(false);
    expect(matchesFilters(a, { ...EMPTY_FILTERS, assignee: "__unassigned__" })).toBe(true);
    expect(activeFilterCount({ ...EMPTY_FILTERS, types: ["bug"], assignee: "u1" })).toBe(2);
  });
});
