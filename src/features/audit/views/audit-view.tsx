import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useProjects } from "@/features/projects/project-context";
import { AuditTable } from "../components/audit-table";
import { useAuditLogs } from "../hooks/audit-queries";
import { PAGE_SIZES, SORT_PARAM, type SortDir, type SortKey } from "../lib/audit-format";

/** System log: the audit trail of the open project (or every visible project), paged server-side. */
export function AuditView({ headerFilters }: { headerFilters?: ReactNode } = {}) {
  const { activeProjectId, isAllProjects } = useProjects();
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState(1);

  // Debounce the search box so typing doesn't fire a query per keystroke.
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(filter.trim()), 300);
    return () => window.clearTimeout(t);
  }, [filter]);

  const { data: pageData, isLoading } = useAuditLogs(
    {
      projectId: !isAllProjects && activeProjectId ? activeProjectId : undefined,
      q: search || undefined,
      sort: SORT_PARAM[sortKey],
      dir: sortDir,
      page,
      pageSize,
    },
    isAllProjects || !!activeProjectId,
  );

  const rows = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  // Reset to first page whenever the query shape changes.
  useEffect(() => {
    setPage(1);
  }, [search, pageSize, sortKey, sortDir, activeProjectId, isAllProjects]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 px-1">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by action, table, field…"
              className="pl-8"
            />
          </div>
          {headerFilters && <div className="flex items-center gap-2">{headerFilters}</div>}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} / {total}
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-7 w-[105px] text-xs bg-transparent border-border transition-colors hover:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isLoading && rows.length > 0 && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-r-none bg-transparent border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="flex h-7 items-center justify-center border-y border-border bg-transparent px-2 text-xs text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-l-none bg-transparent border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AuditTable
          rows={rows}
          isLoading={isLoading}
          filtered={!!filter}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      </div>
    </div>
  );
}
