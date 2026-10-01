import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import {
  ACTIVE_ACCOUNT_STORAGE_KEY,
  setActiveAccountIdStore,
} from "@/features/auth/lib/active-account-store";
import {
  ACTIVE_PROJECT_STORAGE_KEY,
  setActiveProjectIdStore,
} from "@/features/auth/lib/active-project-store";
import { listAccounts, listProjects, type Account, type Project } from "./api/projects.api";
import { projectKeys } from "./hooks/project-queries";

export type { Project, ProjectType } from "./api/projects.api";
type AccountLite = Pick<Account, "id" | "name">;

const ALL_PROJECTS = "all";

interface ProjectContextValue {
  /** Active (non-archived) projects the user can open. Used by every picker. */
  projects: Project[];
  /** Every project the user can read, archived ones included (history/reporting only). */
  allProjects: Project[];
  /** Archived projects the user administers (account admin / super admin). */
  archivedProjects: Project[];
  visibleProjects: Project[];
  accounts: AccountLite[];
  accountFilterId: string | null;
  setAccountFilterId: (id: string | null) => void;
  activeProjectId: string | null;
  activeProject: Project | null;
  isAllProjects: boolean;
  setActiveProjectId: (id: string | null) => void;
  isLoading: boolean;
  refetch: () => void;
}

const Ctx = createContext<ProjectContextValue | undefined>(undefined);

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user, globalRoles, adminAccountIds } = useAuth();
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [accountFilterId, setAccountFilterIdState] = useState<string | null>(null);

  const {
    data: allProjects = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: projectKeys.list(user?.id),
    enabled: !!user,
    queryFn: listProjects,
  });
  const { data: accounts = [] } = useQuery({
    queryKey: projectKeys.accounts(user?.id),
    enabled: !!user,
    queryFn: listAccounts,
  });

  const isSuperAdmin = globalRoles.includes("super_admin");
  const projects = useMemo(() => allProjects.filter((p) => !p.archivedAt), [allProjects]);
  const archivedProjects = useMemo(
    () =>
      allProjects.filter(
        (p) => !!p.archivedAt && (isSuperAdmin || adminAccountIds.includes(p.accountId)),
      ),
    [allProjects, isSuperAdmin, adminAccountIds],
  );

  useEffect(() => {
    if (!accounts.length) return;
    const stored = readStorage(ACTIVE_ACCOUNT_STORAGE_KEY);
    const next = stored && accounts.some((a) => a.id === stored) ? stored : accounts[0]!.id;
    setAccountFilterIdState(next);
    setActiveAccountIdStore(next);
    writeStorage(ACTIVE_ACCOUNT_STORAGE_KEY, next);
  }, [accounts]);

  useEffect(() => {
    if (!projects.length || !accountFilterId) return;
    const inAccount = projects.filter((p) => p.accountId === accountFilterId);
    if (!inAccount.length) {
      setActiveProjectIdState(null);
      setActiveProjectIdStore(null);
      return;
    }
    const stored = readStorage(ACTIVE_PROJECT_STORAGE_KEY);
    // An admin viewing an archived project keeps it open across refetches.
    const storedProject =
      stored && stored !== ALL_PROJECTS
        ? (inAccount.find((p) => p.id === stored) ??
          archivedProjects.find((p) => p.id === stored && p.accountId === accountFilterId))
        : null;
    const next = storedProject ? storedProject.id : inAccount[0]!.id;
    setActiveProjectIdState(next);
    setActiveProjectIdStore(next);
  }, [projects, archivedProjects, accountFilterId]);

  const setActiveProjectId = (id: string | null) => {
    setActiveProjectIdState(id);
    setActiveProjectIdStore(id);
    writeStorage(ACTIVE_PROJECT_STORAGE_KEY, id);
  };

  const visibleProjects = accountFilterId
    ? projects.filter((p) => p.accountId === accountFilterId)
    : projects;

  const setAccountFilterId = (id: string | null) => {
    setAccountFilterIdState(id);
    setActiveAccountIdStore(id);
    writeStorage(ACTIVE_ACCOUNT_STORAGE_KEY, id);
    if (id) {
      // Accounts with no projects yet clear the active project so the first-project state shows.
      const first = projects.find((p) => p.accountId === id);
      setActiveProjectId(first ? first.id : null);
    }
  };

  const isAllProjects = activeProjectId === ALL_PROJECTS;
  const activeProject =
    projects.find((p) => p.id === activeProjectId) ??
    archivedProjects.find((p) => p.id === activeProjectId) ??
    null;

  return (
    <Ctx.Provider
      value={{
        projects,
        allProjects,
        archivedProjects,
        visibleProjects,
        accounts,
        accountFilterId,
        setAccountFilterId,
        activeProjectId,
        activeProject,
        isAllProjects,
        setActiveProjectId,
        isLoading,
        refetch: () => void refetch(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** Like useProjects, but returns undefined outside the provider. */
export function useOptionalProjects() {
  return useContext(Ctx);
}

export function useProjects() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProjects must be used inside ProjectProvider");
  return ctx;
}
