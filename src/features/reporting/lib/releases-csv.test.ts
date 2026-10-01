import { describe, expect, it } from "vitest";
import type { SprintReportRow, TicketReportRow } from "../api/reporting.api";
import { buildReleaseCsv, csvEscape, typeAction } from "./releases-csv";

describe("csvEscape", () => {
  it("quotes only values that need it and doubles embedded quotes", () => {
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line\nbreak")).toBe('"line\nbreak"');
  });
});

describe("typeAction", () => {
  it("maps ticket types to release-note verbs", () => {
    expect(typeAction("bug")).toBe("Fixed");
    expect(typeAction("story")).toBe("Added");
    expect(typeAction("epic")).toBe("Shipped");
  });
});

describe("buildReleaseCsv", () => {
  it("writes one row per ticket under each sprint, with the sprint end date", () => {
    const sprints = [
      { id: "s1", name: "Sprint 1", endsAt: "2026-03-01T00:00:00.000Z" },
      { id: "s2", name: "Sprint, two", endsAt: null },
    ] as unknown as SprintReportRow[];
    const tickets = {
      s1: [{ code: "APP-1", type: "bug", title: 'Fix "login"' }],
      s2: [{ code: "APP-2", type: "task", title: "Add export" }],
    } as unknown as Record<string, TicketReportRow[]>;
    const csv = buildReleaseCsv(sprints, tickets, (iso) => iso.slice(0, 10));
    expect(csv.split("\n")).toEqual([
      "Date,Ticket ID,Type,Description,Sprint",
      '2026-03-01,APP-1,bug,"Fix ""login""",Sprint 1',
      ',APP-2,task,Add export,"Sprint, two"',
    ]);
  });
});
