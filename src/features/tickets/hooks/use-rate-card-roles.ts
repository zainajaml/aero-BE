import { useMemo } from "react";
import { useRates } from "./ticket-queries";

/**
 * Distinct role names from the rate card (GET /rate-card?ids=…), scoped to one project when
 * given, otherwise across every project the user can see. The rate card is the source of
 * truth for job titles used in ticket estimates.
 */
export function useRateCardRoles(projectId?: string | null) {
  const query = useRates(projectId);
  const data = useMemo(() => {
    if (!query.data) return undefined;
    const set = new Set<string>();
    for (const row of query.data) {
      const role = row.role?.trim();
      if (role) set.add(role);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [query.data]);
  return { ...query, data };
}
