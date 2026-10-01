import { useMemo, useState } from "react";
import { Check, Loader2, Search, Users } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/project-context";
import type { OrgUserList } from "../api/admin.api";
import { useInvalidateAdmin } from "../hooks/admin-queries";
import {
  expandInvitations,
  expandUsers,
  labelHelpers,
  matchesInvitationSearch,
  matchesUserSearch,
  sortUsers,
  type ScopeContext,
  type SortDir,
  type SortKey,
} from "../lib/user-rows";
import { InviteDialog } from "./invite-dialog";
import { UsersTable } from "./users-table";

/** Admin › User Management: members and pending invitations of the open account/project. */
export function UsersTab({
  data,
  isLoading,
}: {
  data: OrgUserList | undefined;
  isLoading: boolean;
}) {
  const { user, hasRole } = useAuth();
  const { activeProjectId, isAllProjects, accountFilterId } = useProjects();
  const invalidateAdmin = useInvalidateAdmin();

  const [sortKey, setSortKey] = useState<SortKey>("first");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);

  const isClientAdminOnly = data?.scope.isClientAdmin ?? false;
  const currentUserIsSuperAdmin = hasRole("super_admin");
  const inviteLimit = data?.scope.inviteLimit ?? null;
  const invitesUsed = data?.scope.invitesUsed ?? 0;

  const helpers = useMemo(() => labelHelpers(data), [data]);

  const activeAccountId =
    (activeProjectId && !isAllProjects
      ? data?.projects.find((project) => project.id === activeProjectId)?.accountId
      : null) ??
    accountFilterId ??
    null;

  const ctx: ScopeContext = {
    activeProjectId,
    isAllProjects,
    accountFilterId,
    activeAccountId,
    showAllUsers,
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortDir(null);
        setSortKey(null);
      } else setSortDir("asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const sortedUsers = sortUsers(data?.users ?? [], sortKey, sortDir, helpers.projectsLabel);
  const filteredUsers = q
    ? sortedUsers.filter((u) => matchesUserSearch(u, q, helpers))
    : sortedUsers;
  const filteredInvitations = q
    ? (data?.invitations ?? []).filter((inv) => matchesInvitationSearch(inv, q, helpers))
    : (data?.invitations ?? []);
  const expandedUsers = expandUsers(filteredUsers, ctx, helpers, sortKey, sortDir);
  const expandedInvitations = expandInvitations(filteredInvitations, ctx, helpers);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentUserIsSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowAllUsers((v) => !v)}
              className={
                "rounded-full px-4 transition-colors " +
                (showAllUsers
                  ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-transparent border-border text-foreground shadow-sm hover:border-primary hover:bg-primary hover:text-primary-foreground")
              }
            >
              {showAllUsers ? (
                <>
                  <Check className="h-4 w-4" />
                  Hide All Users
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Show All Users
                </>
              )}
            </Button>
          )}
          {isClientAdminOnly && inviteLimit !== null && (
            <span className="text-xs text-muted-foreground">
              {invitesUsed}/{inviteLimit} people used
            </span>
          )}
          <InviteDialog
            projects={data?.projects ?? []}
            accounts={data?.accounts ?? []}
            clientAdminOnly={isClientAdminOnly}
            currentUserIsSuperAdmin={currentUserIsSuperAdmin}
            inviteLimitReached={
              isClientAdminOnly && inviteLimit !== null && invitesUsed >= inviteLimit
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading members…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <UsersTable
            data={data}
            users={expandedUsers}
            invitations={expandedInvitations}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            currentUserId={user?.id}
            currentUserIsSuperAdmin={currentUserIsSuperAdmin}
            activeAccountId={activeAccountId}
            showAllUsers={showAllUsers}
            onChanged={invalidateAdmin}
          />
        </div>
      )}
    </div>
  );
}
