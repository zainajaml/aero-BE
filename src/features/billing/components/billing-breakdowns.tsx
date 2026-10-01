import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { formatAud, type ProjectRow, type ServiceRow } from "../lib/billing";

export function BillingBreakdowns({
  servicesSummary,
  projectsSummary,
}: {
  servicesSummary: ServiceRow[];
  projectsSummary: ProjectRow[];
}) {
  const servicesTotal = servicesSummary.reduce((sum, s) => sum + Number(s?.gross_cost ?? 0), 0);
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card className="bg-card lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Services Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {servicesSummary.length === 0 && (
            <p className="text-sm text-muted-foreground">No services data.</p>
          )}
          {servicesSummary.map((s, i) => {
            const gross = Number(s?.gross_cost ?? 0);
            const pct = servicesTotal > 0 ? (gross / servicesTotal) * 100 : 0;
            return (
              <div key={s?.service_description ?? s?.service ?? i}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-foreground">
                    {s?.service_description ?? s?.service ?? "Unknown"}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatAud(gross)}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                  {pct.toFixed(1)}% of spend
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">GCP Project Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GCP Project Name</TableHead>
                <TableHead className="text-right">Gross Cost</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Net Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsSummary.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No project data.
                  </TableCell>
                </TableRow>
              )}
              {projectsSummary.map((p, i) => (
                <TableRow key={p?.gcp_project_id ?? i}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {p?.gcp_project_name ?? p?.gcp_project_id ?? "Unknown"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {p?.gcp_project_id ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAud(Number(p?.gross_cost ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-500">
                    -{formatAud(Math.abs(Number(p?.total_credits ?? 0)))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAud(Number(p?.net_cost ?? 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
