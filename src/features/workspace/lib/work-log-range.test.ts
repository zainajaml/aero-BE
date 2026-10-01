import { describe, expect, it } from "vitest";
import type { useTimezone } from "@/features/users/lib/timezone";
import { DAY_MS, inRange, resolveRange, sprintWindowOf } from "./work-log-range";

// A UTC "timezone" pinned to Wednesday 2026-03-11 12:00Z.
const NOW = Date.UTC(2026, 2, 11, 12);
const ms = (v?: string | number | Date) => (v === undefined ? NOW : new Date(v).getTime());
const startOfDay = (v?: string | number | Date) => Math.floor(ms(v) / DAY_MS) * DAY_MS;
const tz = {
  startOfDay,
  startOfWeek: (v?: string | number | Date) => {
    const day = startOfDay(v);
    const weekday = (new Date(day).getUTCDay() + 6) % 7; // Monday = 0
    return day - weekday * DAY_MS;
  },
  startOfMonth: (v?: string | number | Date) => {
    const d = new Date(ms(v));
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  },
} as unknown as ReturnType<typeof useTimezone>;

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

describe("resolveRange", () => {
  it("resolves presets as half-open day windows", () => {
    expect(resolveRange("today", undefined, undefined, null, tz)).toEqual({
      from: day("2026-03-11"),
      to: day("2026-03-12"),
    });
    expect(resolveRange("yesterday", undefined, undefined, null, tz)).toEqual({
      from: day("2026-03-10"),
      to: day("2026-03-11"),
    });
    // "Last week" is the previous Monday-to-Monday week.
    expect(resolveRange("last7", undefined, undefined, null, tz)).toEqual({
      from: day("2026-03-02"),
      to: day("2026-03-09"),
    });
    expect(resolveRange("month", undefined, undefined, null, tz)).toEqual({
      from: day("2026-03-01"),
      to: day("2026-03-12"),
    });
  });

  it("orders a reversed custom range and lets a sprint window win", () => {
    const from = new Date("2026-03-05T10:00:00Z");
    const to = new Date("2026-03-01T10:00:00Z");
    expect(resolveRange("custom", from, to, null, tz)).toEqual({
      from: day("2026-03-01"),
      to: day("2026-03-06"),
    });
    const sprint = { from: 1, to: 2 };
    expect(resolveRange("today", undefined, undefined, sprint, tz)).toBe(sprint);
  });
});

describe("sprintWindowOf / inRange", () => {
  it("covers the sprint's start day through its end day", () => {
    const window = sprintWindowOf(
      { startsAt: "2026-03-02T09:00:00Z", endsAt: "2026-03-06T17:00:00Z" },
      tz,
    )!;
    expect(window).toEqual({ from: day("2026-03-02"), to: day("2026-03-07") });
    expect(inRange("2026-03-06T23:59:59Z", window)).toBe(true);
    expect(inRange("2026-03-07T00:00:00Z", window)).toBe(false);
    expect(sprintWindowOf({ startsAt: null, endsAt: null }, tz)).toBeNull();
  });
});
