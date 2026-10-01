import { ArrowDown, ArrowUp, ArrowUpDown, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { OrgUserList } from "../api/admin.api";
import { isInvitationPastExpiry, roleLabel } from "../lib/roles";
import type { InvitationRow, SortDir, SortKey, UserRow } from "../lib/user-rows";
import { HiddenEmailCell } from "./hidden-email-cell";
import { InvitationActions } from "./invitation-actions";
import { DeleteMemberButton } from "./member-actions";
import { RoleEditor } from "./role-editor";

const COLS = [
  { key: "first", label: "First name", w: "12%", sortable: true },
  { key: "last", label: "Last name", w: "12%", sortable: true },
  { key: "email", label: "Email", w: "20%", sortable: true },
  { key: "projects", label: "Project", w: "12%", sortable: true },
  { key: "role", label: "Role", w: "12%", sortable: true },
  { key: "job", label: "Job title", w: "13%", sortable: true },
  { key: "status", label: "Status", w: "9%", sortable: true },
  { key: "actions", label: "Actions", w: "10%", sortable: false },
] as const;

function ColGroup() {
  return (
    <colgroup>
      {COLS.map((c) => (
        <col key={c.key} style={{ width: c.w }} />
      ))}
    </colgroup>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
  if (sortDir === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5 text-foreground" />;
  return <ArrowDown className="ml-1 h-3.5 w-3.5 text-foreground" />;
}

export interface UsersTableProps {
  data: OrgUserList | undefined;
  users: UserRow[];
  invitations: InvitationRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  currentUserId: string | undefined;
  currentUserIsSuperAdmin: boolean;
  activeAccountId: string | null;
  showAllUsers: boolean;
  onChanged: (targetUserId?: string) => void;
}

export function UsersTable({
  data,
  users,
  invitations,
  sortKey,
  sortDir,
  onSort,
  currentUserId,
  currentUserIsSuperAdmin,
  activeAccountId,
  showAllUsers,
  onChanged,
}: UsersTableProps) {
  const isClientAdminOnly = data?.scope.isClientAdmin ?? false;

  // The last active Account Admin of the open account cannot change their own role.
  const isRoleLocked = (u: UserRow) =>
    u.id === currentUserId &&
    u.role === "account_admin" &&
    !!activeAccountId &&
    u.accountIds.includes(activeAccountId) &&
    !(data?.users ?? []).some(
      (x) =>
        x.id !== u.id &&
        x.role === "account_admin" &&
        x.accountIds.includes(activeAccountId) &&
        !x.archivedAt,
    );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="w-full">
        <div className="sticky top-0 z-10 bg-background">
          <Table
            containerClassName="shrink-0 overflow-visible"
            className="w-full table-fixed [&_th]:h-7 [&_th]:whitespace-nowrap"
          >
            <ColGroup />
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLS.map((col) => (
                  <TableHead key={col.key}>
                    {col.sortable ? (
                      <button
                        onClick={() => onSort(col.key as SortKey)}
                        className="flex items-center font-medium"
                      >
                        {col.label}{" "}
                        <SortIcon col={col.key as SortKey} sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <Table
          containerClassName="overflow-visible"
          className="w-full table-fixed [&_td]:truncate [&_td]:py-1"
        >
          <ColGroup />
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.rowKey}>
                <TableCell className="font-medium">
                  {u.firstName || u.fullName?.split(" ")[0] || u.email?.split("@")[0] || "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {u.lastName ||
                    (u.fullName ? u.fullName.split(" ").slice(1).join(" ") || "—" : "—")}
                </TableCell>
                <TableCell className="truncate text-sm text-muted-foreground">
                  {u.emailHidden ? (
                    <HiddenEmailCell user={u} onSaved={() => onChanged(u.id)} />
                  ) : (
                    u.email || "—"
                  )}
                </TableCell>
                <TableCell className="truncate text-sm text-muted-foreground">
                  {u.rowProjectLabel}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{roleLabel(u.role)}</TableCell>
                <TableCell className="truncate text-sm text-muted-foreground">
                  {u.jobTitle || "—"}
                </TableCell>
                <TableCell>
                  {u.archivedAt ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Archived
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <RoleEditor
                      user={u}
                      projects={data?.projects ?? []}
                      accounts={data?.accounts ?? []}
                      clientAdminOnly={isClientAdminOnly}
                      currentUserIsSuperAdmin={currentUserIsSuperAdmin}
                      isSuperAdmin={data?.scope.isGlobalAdmin ?? false}
                      globalView={showAllUsers}
                      roleLocked={isRoleLocked(u)}
                      onSaved={() => onChanged(u.id)}
                    />
                    <DeleteMemberButton
                      user={u}
                      projectId={u.rowProjectId ?? null}
                      projectLabel={u.rowProjectLabel}
                      currentUserIsSuperAdmin={currentUserIsSuperAdmin}
                      onDeleted={() => onChanged(u.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {invitations.map((inv) => {
              const expired = isInvitationPastExpiry(inv.expiresAt);
              return (
                <TableRow key={`inv-${inv.rowKey}`} className="bg-muted/20">
                  <TableCell className="font-medium text-muted-foreground">—</TableCell>
                  <TableCell className="font-medium text-muted-foreground">—</TableCell>
                  <TableCell className="truncate text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{inv.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate text-sm text-muted-foreground">
                    {inv.rowProjectLabel}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {roleLabel(inv.role)}
                  </TableCell>
                  <TableCell className="truncate text-sm text-muted-foreground">
                    {inv.jobTitle || "—"}
                  </TableCell>
                  <TableCell>
                    {expired ? (
                      <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <InvitationActions
                      invitationId={inv.id}
                      email={inv.email}
                      expired={expired}
                      onDone={() => onChanged()}
                    />
                  </TableCell>
                </TableRow>
              );
            })}

            {users.length === 0 && invitations.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  {data?.users.length || data?.invitations.length
                    ? "No members match your search."
                    : "No members yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
