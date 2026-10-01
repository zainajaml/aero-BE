import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  FileText,
  GripVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TreeNode } from "../lib/document-tree";
import { DraggablePage } from "./tree-dnd";

export interface TreeNodeHandlers {
  selectedId: string | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string, open: boolean) => void;
  onSelect: (node: TreeNode) => void;
}

function NodeIcon({ node }: { node: TreeNode }) {
  return (
    <span className="shrink-0">
      {node.icon ??
        (node.file ? (
          <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        ))}
    </span>
  );
}

function ExpandButton({ node, ctx }: { node: TreeNode; ctx: TreeNodeHandlers }) {
  const hasChildren = node.children.length > 0;
  const isOpen = ctx.expanded[node.id];
  return (
    <button
      className="grid h-6 w-5 shrink-0 place-items-center text-muted-foreground"
      onClick={() => ctx.onToggle(node.id, !isOpen)}
      aria-label={isOpen ? "Collapse" : "Expand"}
    >
      {hasChildren ? (
        isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )
      ) : (
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
      )}
    </button>
  );
}

/** Editable page row in a project's tree (drag handle + delete when the user can write). */
export function DocumentTreeNode({
  node,
  depth,
  ctx,
  canEdit,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  ctx: TreeNodeHandlers;
  canEdit: boolean;
  onDelete: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = ctx.expanded[node.id];
  return (
    <DraggablePage dragId={node.id}>
      {(drag) => (
        <div ref={drag.setNodeRef} className={cn(drag.isDragging && "opacity-40")}>
          <div
            className={cn(
              "group flex items-center gap-1 rounded-lg pr-1 text-sm hover:bg-accent/50",
              ctx.selectedId === node.id && "bg-accent/60",
            )}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
          >
            {canEdit && (
              <button
                type="button"
                aria-label="Drag page into a folder"
                className={cn(
                  "hidden h-6 w-4 shrink-0 place-items-center text-muted-foreground/60 touch-none group-hover:grid",
                  drag.isDragging ? "cursor-grabbing" : "cursor-grab",
                )}
                onClick={(ev) => ev.preventDefault()}
                {...drag.handleProps}
              >
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            <ExpandButton node={node} ctx={ctx} />
            <button
              onClick={() => ctx.onSelect(node)}
              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
            >
              <NodeIcon node={node} />
              <span className="truncate">{node.title || "Untitled"}</span>
            </button>
            {canEdit && (
              <button
                onClick={() => onDelete(node.id)}
                className="hidden h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive group-hover:grid"
                aria-label="Delete page"
                title="Delete page"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {hasChildren &&
            isOpen &&
            node.children.map((c) => (
              <DocumentTreeNode
                key={c.id}
                node={c}
                depth={depth + 1}
                ctx={ctx}
                canEdit={canEdit}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
    </DraggablePage>
  );
}

// Read-only node renderer for the All Projects overview (no drag / create).
export function ReadOnlyTreeNode({
  node,
  depth,
  ctx,
}: {
  node: TreeNode;
  depth: number;
  ctx: TreeNodeHandlers;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = ctx.expanded[node.id];
  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg pr-1 text-sm hover:bg-accent/50",
          ctx.selectedId === node.id && "bg-accent/60",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <ExpandButton node={node} ctx={ctx} />
        <button
          onClick={() => ctx.onSelect(node)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        >
          <NodeIcon node={node} />
          <span className="truncate">{node.title || "Untitled"}</span>
        </button>
      </div>
      {hasChildren &&
        isOpen &&
        node.children.map((c) => (
          <ReadOnlyTreeNode key={c.id} node={c} depth={depth + 1} ctx={ctx} />
        ))}
    </div>
  );
}
