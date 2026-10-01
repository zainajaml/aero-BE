import { ChevronDown, ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import type { DocumentTreeState } from "../hooks/use-document-tree-state";
import { UNGROUPED, type ProjectDocumentGroup, type TreeNode } from "../lib/document-tree";
import { ReadOnlyTreeNode, type TreeNodeHandlers } from "./document-tree-node";

/** All Projects overview sidebar: every folder and page grouped by project (A–Z), read-only. */
export function AllProjectsTree({
  groups,
  isLoading,
  tree: state,
  selectedId,
  onSelect,
}: {
  groups: ProjectDocumentGroup[];
  isLoading: boolean;
  tree: DocumentTreeState;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) {
  const ctx: TreeNodeHandlers = {
    selectedId,
    expanded: state.expanded,
    onToggle: state.togglePage,
    onSelect,
  };
  const renderNode = (n: TreeNode) => <ReadOnlyTreeNode key={n.id} node={n} depth={0} ctx={ctx} />;

  return (
    <GlassPanel className="flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center justify-between gap-1 px-1">
        <h2 className="text-sm font-semibold tracking-tight">All Pages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No pages yet.</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const ungrouped = group.rootsByFolder.get(UNGROUPED) ?? [];
              const hasAny =
                ungrouped.length > 0 ||
                group.folders.some((f) => (group.rootsByFolder.get(f.id) ?? []).length > 0);
              if (!hasAny) return null;
              return (
                <div key={group.projectId} className="space-y-1">
                  <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.projectName}
                  </p>
                  {group.folders.map((folder) => {
                    const items = group.rootsByFolder.get(folder.id) ?? [];
                    if (items.length === 0) return null;
                    const isOpen = state.isFolderOpen(folder.id);
                    return (
                      <div key={folder.id}>
                        <button
                          onClick={() => state.setFolderOpen(folder.id, !isOpen)}
                          className="flex w-full items-center gap-1 rounded-lg pr-1 text-sm hover:bg-accent/40"
                        >
                          <span className="grid h-7 w-5 shrink-0 place-items-center text-muted-foreground">
                            {isOpen ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {isOpen ? (
                              <FolderOpen className="h-3.5 w-3.5" />
                            ) : (
                              <Folder className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate py-1.5 text-left font-medium">
                            {folder.name}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="ml-2 border-l border-border/40 pl-1">
                            {items.map(renderNode)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {ungrouped.map(renderNode)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
