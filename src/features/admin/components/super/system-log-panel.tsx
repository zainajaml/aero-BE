import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAdministeredAccounts } from "@/features/accounts/hooks/account-queries";
import { AuditView } from "@/features/audit/views/audit-view";
import { useProjects } from "@/features/projects/project-context";

/** Super Admin › System Log: the audit trail with account/project pickers. */
export function SystemLogPanel() {
  const { projects, setActiveProjectId } = useProjects();
  const { data: accounts } = useAdministeredAccounts();
  const [accountId, setAccountId] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    if (accountId === "all") return projects;
    return projects.filter((p) => p.accountId === accountId);
  }, [projects, accountId]);

  const accountFilter = (
    <Select
      value={accountId}
      onValueChange={(v) => {
        setAccountId(v);
        setActiveProjectId("all");
      }}
    >
      <SelectTrigger className="h-8 w-48">
        <SelectValue placeholder="All accounts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All accounts</SelectItem>
        {(accounts ?? []).map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const projectFilter = (
    <Select defaultValue="all" onValueChange={(v) => setActiveProjectId(v)}>
      <SelectTrigger className="h-8 w-56">
        <SelectValue placeholder="All projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All projects</SelectItem>
        {filteredProjects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="min-h-[60vh]">
      <AuditView
        headerFilters={
          <>
            {accountFilter}
            {projectFilter}
          </>
        }
      />
    </div>
  );
}
