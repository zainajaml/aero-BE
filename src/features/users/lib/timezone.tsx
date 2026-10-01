import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { updateMyProfile } from "../api/profile.api";
import { useAuth } from "@/features/auth/auth-context";

export type TzCode = "PKT" | "IST" | "AEST";

export interface TzInfo {
  code: TzCode;
  label: string;
  iana: string;
  offsetMin: number; // fixed offset from UTC in minutes (none of these observe DST)
}

export const TIMEZONES: TzInfo[] = [
  { code: "PKT", label: "PKT (UTC+5)", iana: "Asia/Karachi", offsetMin: 300 },
  { code: "IST", label: "IST (UTC+5:30)", iana: "Asia/Kolkata", offsetMin: 330 },
  { code: "AEST", label: "AEST (UTC+10)", iana: "Australia/Brisbane", offsetMin: 600 },
];

const DEFAULT_TZ: TzCode = "PKT";
const STORAGE_KEY = "aero-timezone";

export function tzInfo(code: TzCode): TzInfo {
  return TIMEZONES.find((t) => t.code === code) ?? TIMEZONES[0];
}

function isTzCode(v: unknown): v is TzCode {
  return v === "PKT" || v === "IST" || v === "AEST";
}

interface TimezoneState {
  tz: TzCode;
  info: TzInfo;
  setTz: (tz: TzCode) => void;
  /** Format an absolute instant in the active timezone. */
  formatDateTime: (value: string | number | Date, opts?: Intl.DateTimeFormatOptions) => string;
  /** Format a date-only label in the active timezone. */
  formatDate: (value: string | number | Date, opts?: Intl.DateTimeFormatOptions) => string;
  /** Calendar boundaries (epoch ms, UTC) computed in the active timezone. */
  startOfDay: (value?: string | number | Date) => number;
  startOfWeek: (value?: string | number | Date) => number; // Monday-based
  startOfMonth: (value?: string | number | Date) => number;
}

const TimezoneContext = createContext<TimezoneState | undefined>(undefined);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tz, setTzState] = useState<TzCode>(() => {
    if (typeof window === "undefined") return DEFAULT_TZ;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTzCode(stored) ? stored : DEFAULT_TZ;
  });

  // Load the saved preference from the user's profile.
  const savedTz = user?.timezone;
  useEffect(() => {
    if (isTzCode(savedTz)) {
      setTzState(savedTz);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, savedTz);
    }
  }, [savedTz]);

  const setTz = useCallback(
    (next: TzCode) => {
      setTzState(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      if (user) void updateMyProfile({ timezone: next }).catch(() => undefined);
    },
    [user],
  );

  const value = useMemo<TimezoneState>(() => {
    const info = tzInfo(tz);
    const offsetMs = info.offsetMin * 60 * 1000;

    const formatDateTime = (v: string | number | Date, opts?: Intl.DateTimeFormatOptions) =>
      new Date(v).toLocaleString(undefined, {
        timeZone: info.iana,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...opts,
      });

    const formatDate = (v: string | number | Date, opts?: Intl.DateTimeFormatOptions) =>
      new Date(v).toLocaleDateString(undefined, {
        timeZone: info.iana,
        month: "short",
        day: "numeric",
        ...opts,
      });

    // Shift so UTC getters reflect the wall-clock time in the target zone.
    const zonedParts = (v?: string | number | Date) => {
      const base = v == null ? Date.now() : new Date(v).getTime();
      const shifted = new Date(base + offsetMs);
      return {
        y: shifted.getUTCFullYear(),
        m: shifted.getUTCMonth(),
        d: shifted.getUTCDate(),
        dow: shifted.getUTCDay(), // 0 = Sunday
      };
    };

    const startOfDay = (v?: string | number | Date) => {
      const { y, m, d } = zonedParts(v);
      return Date.UTC(y, m, d) - offsetMs;
    };

    const startOfWeek = (v?: string | number | Date) => {
      const { y, m, d, dow } = zonedParts(v);
      const daysSinceMonday = (dow + 6) % 7;
      return Date.UTC(y, m, d) - daysSinceMonday * 24 * 60 * 60 * 1000 - offsetMs;
    };

    const startOfMonth = (v?: string | number | Date) => {
      const { y, m } = zonedParts(v);
      return Date.UTC(y, m, 1) - offsetMs;
    };

    return { tz, info, setTz, formatDateTime, formatDate, startOfDay, startOfWeek, startOfMonth };
  }, [tz, setTz]);

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error("useTimezone must be used inside TimezoneProvider");
  return ctx;
}
