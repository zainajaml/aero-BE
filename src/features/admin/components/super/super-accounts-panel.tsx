import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useAdministeredAccounts } from "@/features/accounts/hooks/account-queries";
import { AccountRowView, CreateAccountButton, ProjectMoveRow } from "./super-account-rows";

/** Super Admin › Accounts: every account, plus moving projects between accounts. */
export function SuperAccountsPanel() {
  const { data, isLoading } = useAdministeredAccounts();

  const allProjects = useMemo(() => {
    const rows: {
      id: string;
      name: string;
      accountId: string;
      accountName: string;
      key: string;
    }[] = [];
    for (const acc of data ?? []) {
      for (const p of acc.projects) {
        rows.push({ id: p.id, name: p.name, key: p.key, accountId: acc.id, accountName: acc.name });
      }
    }
    return rows.sort(
      (a, b) => a.accountName.localeCompare(b.accountName) || a.name.localeCompare(b.name),
    );
  }, [data]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Create accounts, rename or remove them, and move projects between accounts.
          </p>
        </div>
        <CreateAccountButton />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading accounts…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">All accounts</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <Table
                  containerClassName="overflow-visible"
                  className="w-full table-fixed [&_td]:py-1 [&_th]:h-7 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background"
                >
                  <colgroup>
                    <col style={{ width: "220px", minWidth: "220px" }} />
                    <col style={{ width: "160px", minWidth: "160px" }} />
                    <col style={{ width: "260px", minWidth: "260px" }} />
                    <col style={{ width: "80px", minWidth: "80px" }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data ?? []).map((acc) => (
                      <AccountRowView key={acc.id} account={acc} />
                    ))}
                    {(data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-sm text-muted-foreground"
                        >
                          No accounts yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <h3 className="text-sm font-medium">Projects</h3>
            <p className="text-xs text-muted-foreground">
              Reassign any project to a different account.
            </p>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <Table
                  containerClassName="overflow-visible"
                  className="w-full table-fixed [&_td]:py-1 [&_th]:h-7"
                >
                  <colgroup>
                    <col style={{ width: "220px", minWidth: "220px" }} />
                    <col style={{ width: "140px", minWidth: "140px" }} />
                    <col style={{ width: "280px", minWidth: "280px" }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead className="w-64">Account</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProjects.map((p) => (
                      <ProjectMoveRow key={p.id} project={p} accounts={data ?? []} />
                    ))}
                    {allProjects.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-6 text-center text-sm text-muted-foreground"
                        >
                          No projects yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
