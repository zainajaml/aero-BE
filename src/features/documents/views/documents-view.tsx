import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { useCanWrite } from "@/features/auth/hooks/use-can-write";
import { useProjects } from "@/features/projects/project-context";
import { AllProjectsTree } from "../components/all-projects-tree";
import {
  DeleteFolderDialog,
  DeletePageDialog,
  UnsavedChangesDialog,
} from "../components/document-dialogs";
import { DocumentEditorPane } from "../components/document-editor-pane";
import { ProjectDocumentTree } from "../components/project-document-tree";
import { useDocumentLibrary } from "../hooks/document-queries";
import { useDocumentDraft } from "../hooks/use-document-draft";
import {
  useCreateDocument,
  useCreateFolder,
  useDeleteDocument,
  useDeleteFolder,
  useMoveDocument,
  useRenameFolder,
  useUploadDocumentFile,
} from "../hooks/use-document-mutations";
import { useDocumentTreeState } from "../hooks/use-document-tree-state";
import { groupByProject } from "../lib/document-tree";

function DocumentsHeader({ projectName }: { projectName?: string }) {
  return (
    <div className="space-y-0.5">
      <h2 className="font-display text-xl font-semibold tracking-tight">Documents</h2>
      <p className="text-sm text-muted-foreground">
        {projectName ? (
          <>
            Pages and files for <span className="text-foreground">{projectName}</span>.
          </>
        ) : (
          "Pages and files across all projects."
        )}
      </p>
    </div>
  );
}

export function DocumentsView() {
  const { activeProject, isAllProjects, projects } = useProjects();
  const projectId = activeProject?.id;
  // Cosmetic hint for create/upload/drag affordances; the API decides per document.
  const canWrite = useCanWrite();

  const tree = useDocumentTreeState();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const library = useDocumentLibrary(
    isAllProjects ? null : (projectId ?? null),
    isAllProjects || !!projectId,
  );
  const docs = useMemo(() => library.data?.documents ?? [], [library.data]);
  const folders = useMemo(
    () =>
      [...(library.data?.folders ?? [])].sort(
        (a, b) => a.position - b.position || a.name.localeCompare(b.name),
      ),
    [library.data],
  );
  const draft = useDocumentDraft(docs);

  const projectGroups = useMemo(() => {
    if (!isAllProjects) return [];
    const nameById = new Map(projects.map((p) => [p.id, p.name] as const));
    return groupByProject(docs, folders, nameById);
  }, [isAllProjects, projects, docs, folders]);

  const createDoc = useCreateDocument(projectId, (doc, opts) => {
    if (opts.parentId) tree.togglePage(opts.parentId, true);
    if (opts.folderId) tree.setFolderOpen(opts.folderId, true);
    draft.applySelectDoc(doc);
  });
  const uploadFile = useUploadDocumentFile(projectId, (doc) => draft.applySelectDoc(doc));
  const deleteDoc = useDeleteDocument(() => {
    draft.clearSelection();
    setDeleteId(null);
  });
  const createFolder = useCreateFolder(projectId, (id) => {
    tree.setFolderOpen(id, true);
    tree.startRename(id, "New Folder");
  });
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder(() => setDeleteFolderId(null));
  const moveDoc = useMoveDocument(projectId);

  if (!projectId && !isAllProjects) {
    return (
      <GlassPanel className="grid min-h-[60vh] place-items-center p-8 text-center">
        <div className="max-w-sm space-y-2">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No project selected</h2>
          <p className="text-sm text-muted-foreground">
            Documents are organized per project. Choose a project from the switcher to view its
            pages.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <DocumentsHeader projectName={isAllProjects ? undefined : activeProject?.name} />
      <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[300px_1fr]">
        {isAllProjects ? (
          <AllProjectsTree
            groups={projectGroups}
            isLoading={library.isLoading}
            tree={tree}
            selectedId={draft.selectedId}
            onSelect={draft.selectDoc}
          />
        ) : (
          <ProjectDocumentTree
            docs={docs}
            folders={folders}
            isLoading={library.isLoading}
            canEdit={canWrite}
            tree={tree}
            selectedId={draft.selectedId}
            uploading={uploadFile.isPending}
            onSelect={draft.selectDoc}
            onCreateFolder={() => createFolder.mutate()}
            onUpload={(file) => uploadFile.mutate({ file, folderId: null })}
            onCreatePage={(folderId) => createDoc.mutate({ parentId: null, folderId })}
            onDeletePage={setDeleteId}
            onDeleteFolder={setDeleteFolderId}
            onRenameFolder={(id, name) => renameFolder.mutate({ id, name })}
            onMove={(id, folderId) => moveDoc.mutate({ id, folderId })}
          />
        )}

        <DocumentEditorPane
          draft={draft}
          allProjects={isAllProjects}
          canWrite={canWrite}
          onDelete={setDeleteId}
        />

        <UnsavedChangesDialog draft={draft} />
        <DeletePageDialog
          pageId={deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={(id) => deleteDoc.mutate(id)}
        />
        <DeleteFolderDialog
          folderId={deleteFolderId}
          onCancel={() => setDeleteFolderId(null)}
          onConfirm={(id) => deleteFolder.mutate(id)}
        />
      </div>
    </div>
  );
}
