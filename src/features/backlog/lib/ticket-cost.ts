import type { ProjectEstimate } from "@/features/tickets/api/tickets.api";
import type { Rate } from "@/features/tickets/api/planning.api";

/**
 * Estimated cost per ticket for the CSV export: each estimate's hours times the average
 * rate-card rate of its role (same formula as the source page).
 */
export function buildTicketCost(rates: Rate[], estimates: ProjectEstimate[]) {
  const rateByRole = new Map<string, number[]>();
  for (const r of rates) {
    const arr = rateByRole.get(r.role) ?? [];
    arr.push(Number(r.hourlyRate) || 0);
    rateByRole.set(r.role, arr);
  }
  const avgRate = (role: string): number => {
    const arr = rateByRole.get(role);
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((s, n) => s + n, 0) / arr.length;
  };
  const byTicket = new Map<string, ProjectEstimate[]>();
  for (const e of estimates) {
    const arr = byTicket.get(e.ticketId) ?? [];
    arr.push(e);
    byTicket.set(e.ticketId, arr);
  }
  return (ticketId: string): number => {
    const arr = byTicket.get(ticketId);
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((s, e) => s + (e.minutes / 60) * avgRate(e.resourceType), 0);
  };
}
