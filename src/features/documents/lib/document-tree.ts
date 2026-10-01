import type { DocumentFolder, DocumentMeta } from "../api/documents.api";

export const UNGROUPED = "__ungrouped__";

export interface TreeNode extends DocumentMeta {
  children: TreeNode[];
}

export interface ProjectDocumentGroup {
  projectId: string;
  projectName: string;
  folders: DocumentFolder[];
  rootsByFolder: Map<string, TreeNode[]>;
}

/** Content comparison that treats an empty doc / single empty paragraph as "no content". */
export function comparableDocumentContent(content: unknown): string {
  if (content == null || content === "") return "";
  if (typeof content === "object" && content !== null) {
    const document = content as { type?: unknown; content?: unknown };
    if (
      document.type === "doc" &&
      (!Array.isArray(document.content) || document.content.length === 0)
    ) {
      return "";
    }
    if (
      document.type === "doc" &&
      Array.isArray(document.content) &&
      document.content.length === 1 &&
      JSON.stringify(document.content[0]) === JSON.stringify({ type: "paragraph" })
    ) {
      return "";
    }
  }
  return JSON.stringify(content);
}

export function buildTree(rows: DocumentMeta[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/** Root pages keyed by folder id (unknown / missing folders fall into UNGROUPED). */
export function groupRootsByFolder(
  tree: TreeNode[],
  folders: DocumentFolder[],
): Map<string, TreeNode[]> {
  const folderIds = new Set(folders.map((f) => f.id));
  const map = new Map<string, TreeNode[]>();
  map.set(UNGROUPED, []);
  folders.forEach((f) => map.set(f.id, []));
  tree.forEach((node) => {
    const key = node.folderId && folderIds.has(node.folderId) ? node.folderId : UNGROUPED;
    map.get(key)!.push(node);
  });
  return map;
}

/** All Projects overview: documents and folders grouped by project, sorted by project name. */
export function groupByProject(
  docs: DocumentMeta[],
  folders: DocumentFolder[],
  projectNames: Map<string, string>,
): ProjectDocumentGroup[] {
  const byProject = new Map<string, { folders: DocumentFolder[]; docs: DocumentMeta[] }>();
  const ensure = (pid: string) => {
    if (!byProject.has(pid)) byProject.set(pid, { folders: [], docs: [] });
    return byProject.get(pid)!;
  };
  folders.forEach((f) => ensure(f.projectId).folders.push(f));
  docs.forEach((d) => ensure(d.projectId).docs.push(d));
  return Array.from(byProject.entries())
    .map(([pid, { folders: pf, docs: pd }]) => ({
      projectId: pid,
      projectName: projectNames.get(pid) ?? "Unknown project",
      folders: [...pf].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
      rootsByFolder: groupRootsByFolder(buildTree(pd), pf),
    }))
    .sort((a, b) => a.projectName.localeCompare(b.projectName));
}
