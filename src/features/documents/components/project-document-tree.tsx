import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { FileText, FolderPlus, Loader2, Plus, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import type { DocumentFolder, DocumentMeta } from "../api/documents.api";
import type { DocumentTreeState } from "../hooks/use-document-tree-state";
import { UNGROUPED, buildTree, groupRootsByFolder, type TreeNode } from "../lib/document-tree";
import { DocumentTreeNode, type TreeNodeHandlers } from "./document-tree-node";
import { FolderHeader } from "./folder-header";
import { DropZone } from "./tree-dnd";

/** Sidebar of one project's documents: create/upload toolbar and the drag-into-folder tree. */
export function ProjectDocumentTree({
  docs,
  folders,
  isLoading,
  canEdit,
  tree: state,
  selectedId,
  uploading,
  onSelect,
  onCreateFolder,
  onUpload,
  onCreatePage,
  onDeletePage,
  onDeleteFolder,
  onRenameFolder,
  onMove,
}: {
  docs: DocumentMeta[];
  folders: DocumentFolder[];
  isLoading: boolean;
  canEdit: boolean;
  tree: DocumentTreeState;
  selectedId: string | null;
  uploading: boolean;
  onSelect: (node: TreeNode) => void;
  onCreateFolder: () => void;
  onUpload: (file: File) => void;
  onCreatePage: (folderId: string | null) => void;
  onDeletePage: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onMove: (id: string, folderId: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const roots = useMemo(() => buildTree(docs), [docs]);
  const rootsByFolder = useMemo(() => groupRootsByFolder(roots, folders), [roots, folders]);
  const draggedDoc = activeDrag ? docs.find((d) => d.id === activeDrag) : null;
  const ungrouped = rootsByFolder.get(UNGROUPED) ?? [];

  const ctx: TreeNodeHandlers = {
    selectedId,
    expanded: state.expanded,
    onToggle: state.togglePage,
    onSelect,
  };

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onUpload(file);
  }

  function commitFolderName() {
    if (state.editingFolderId) {
      onRenameFolder(state.editingFolderId, state.folderNameDraft.trim() || "New Folder");
    }
    state.setEditingFolderId(null);
  }

  const onDragStart = (e: DragStartEvent) => setActiveDrag(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const target = String(e.over.id);
    const folderId = target === UNGROUPED ? null : target;
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    if ((doc.folderId ?? null) === folderId && !doc.parentId) return;
    onMove(id, folderId);
  };

  const renderNode = (n: TreeNode) => (
    <DocumentTreeNode
      key={n.id}
      node={n}
      depth={0}
      ctx={ctx}
      canEdit={canEdit}
      onDelete={onDeletePage}
    />
  );

  return (
    <GlassPanel className="flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center gap-1 px-1">
        {canEdit && (
          <div className="flex w-full items-center justify-evenly gap-1">
            <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 px-2"
              onClick={onCreateFolder}
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              Folder
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 px-2"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              title="Add file"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}{" "}
              Upload File
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 px-2"
              onClick={() => onCreatePage(null)}
              title="Add page"
            >
              <Plus className="h-3.5 w-3.5" />
              Page
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : roots.length === 0 && folders.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No pages yet.{canEdit && " Create your first one."}
          </p>
        ) : (
          <DndContext
            sensors={dndSensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveDrag(null)}
          >
            <div className="space-y-1">
              {folders.map((folder) => {
                const isOpen = state.isFolderOpen(folder.id);
                const items = rootsByFolder.get(folder.id) ?? [];
                return (
                  <DropZone key={folder.id} id={folder.id}>
                    <FolderHeader
                      folder={folder}
                      isOpen={isOpen}
                      canEdit={canEdit}
                      isEditing={state.editingFolderId === folder.id}
                      nameDraft={state.folderNameDraft}
                      onNameDraftChange={state.setFolderNameDraft}
                      onToggle={() => state.setFolderOpen(folder.id, !isOpen)}
                      onStartRename={() => state.startRename(folder.id, folder.name)}
                      onCommitRename={commitFolderName}
                      onCancelRename={() => state.setEditingFolderId(null)}
                      onAddPage={() => onCreatePage(folder.id)}
                      onDelete={() => onDeleteFolder(folder.id)}
                    />
                    {isOpen && (
                      <div className="ml-2 min-h-[6px] border-l border-border/40 pl-1">
                        {items.length === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground/70">
                            Drop pages here
                          </p>
                        ) : (
                          items.map(renderNode)
                        )}
                      </div>
                    )}
                  </DropZone>
                );
              })}

              {/* Ungrouped pages */}
              <DropZone id={UNGROUPED} className="mt-1">
                {folders.length > 0 && (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                    Ungrouped
                  </p>
                )}
                {ungrouped.length === 0
                  ? folders.length > 0 && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground/70">
                        Drop pages here to remove from folders
                      </p>
                    )
                  : ungrouped.map(renderNode)}
              </DropZone>
            </div>

            <DragOverlay dropAnimation={null}>
              {draggedDoc && (
                <div className="flex items-center gap-2 rounded-md border-2 border-dashed border-primary/70 bg-card px-3 py-1.5 text-sm shadow-lg">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{draggedDoc.title || "Untitled"}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </GlassPanel>
  );
}
