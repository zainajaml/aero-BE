import { useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useAuth } from "@/features/auth/auth-context";
import { useCanWrite } from "@/features/auth/hooks/use-can-write";
import { useProjects } from "@/features/projects/project-context";
import { useTimezone } from "@/features/users/lib/timezone";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { TicketDialog } from "@/features/tickets/components/ticket-dialog/ticket-dialog";
import { BulkEditTicketsDialog } from "@/features/tickets/components/bulk-edit/bulk-edit-tickets-dialog";
import { ManageEpicsDialog } from "@/features/tickets/components/epics/manage-epics-dialog";
import { BacklogSection } from "../components/backlog-section";
import { BacklogToolbar } from "../components/backlog-toolbar";
import { BulkActionBar } from "../components/bulk-action-bar";
import { DragPreview } from "../components/drag-preview";
import { SprintSection } from "../components/sprint-section";
import { visibleZoneItems, type RowsContext } from "../components/ticket-rows";
import { BulkMoveConfirmDialog } from "../components/dialogs/bulk-move-confirm-dialog";
import {
  CompleteSprintDialog,
  type PendingSprintClose,
} from "../components/dialogs/complete-sprint-dialog";
import { EditSprintDialog } from "../components/dialogs/edit-sprint-dialog";
import { useBacklogData } from "../hooks/use-backlog-data";
import { backlogCollision, useBacklogDnd, type PendingBulkMove } from "../hooks/use-backlog-dnd";
import { useBacklogTicketMutations } from "../hooks/use-backlog-ticket-mutations";
import { useCollapsedSprints } from "../hooks/use-collapsed-sprints";
import { useSprintMutations } from "../hooks/use-sprint-mutations";
import { useTicketSelection } from "../hooks/use-ticket-selection";
import { EMPTY_FILTERS, matchesFilters, type BacklogFilters } from "../lib/backlog-filters";
import type { BacklogSprint, BacklogTicket, SortKey } from "../lib/backlog-types";
import { exportTicketsCsv } from "../lib/csv-export";
import { displaySprints } from "../lib/sprint-order";
import { isDoneStage } from "../lib/ticket-stage";

export function BacklogView() {
  const { activeProject } = useProjects();
  const tz = useTimezone();
  const canWrite = useCanWrite(); // viewers are strictly read-only
  const { hasAnyRole } = useAuth();
  const isManager = hasAnyRole(["super_admin", "account_admin", "admin"]);
  const projectId = activeProject?.id;

  const data = useBacklogData(projectId);
  const { tickets, sprints } = data;
  const ticketMutations = useBacklogTicketMutations(projectId);
  const sprintMutations = useSprintMutations(projectId);
  const selection = useTicketSelection();
  const { collapsed, toggle: toggleCollapsed } = useCollapsedSprints(projectId);

  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [sprintToDelete, setSprintToDelete] = useState<{ id: string; name: string } | null>(null);
  const [sprintToEdit, setSprintToEdit] = useState<BacklogSprint | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("manual");
  const [filters, setFilters] = useState<BacklogFilters>(EMPTY_FILTERS);
  const [backlogCollapsed, setBacklogCollapsed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [epicsOpen, setEpicsOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [pendingBulkMove, setPendingBulkMove] = useState<PendingBulkMove | null>(null);
  const [pendingSprintClose, setPendingSprintClose] = useState<PendingSprintClose | null>(null);
  const [closeMoveTarget, setCloseMoveTarget] = useState<string>("backlog");

  const dnd = useBacklogDnd({
    tickets,
    sprints,
    sortBy,
    selectedIds: selection.selectedIds,
    ticketMutations,
    sprintMutations,
    onBulkMoveRequest: setPendingBulkMove,
  });

  if (!activeProject) {
    return (
      <GlassPanel className="p-10 text-center">
        <p className="text-muted-foreground">Select or create a project to begin planning.</p>
      </GlassPanel>
    );
  }

  const project = { id: activeProject.id, key: activeProject.key };
  const isKanban = activeProject.projectType === "kanban";
  const { selectedIds } = selection;
  const matches = (t: BacklogTicket) => matchesFilters(t, filters);
  const sprintItems = (sprintId: string) =>
    tickets.filter((t) => t.sprintId === sprintId && matches(t));
  const backlog = tickets.filter((t) => !t.sprintId && matches(t));
  const sortedSprints = displaySprints(sprints, showCompleted);
  const activeTicket = dnd.activeId ? tickets.find((t) => t.id === dnd.activeId) : null;

  const ctx: RowsContext = {
    data,
    stages: filters.stages,
    sortBy,
    canWrite,
    selectedIds,
    setSelectedIds: selection.setSelectedIds,
    onToggleSelect: selection.toggle,
    onOpenTicket: setOpenTicket,
    onChangeEpic: (ticketId, epicId) => ticketMutations.setEpic.mutate({ ticketId, epicId }),
    onChangeStage: (ticketId, columnId) => ticketMutations.setStage.mutate({ ticketId, columnId }),
    previewShiftById: dnd.previewShiftById,
  };

  // Ending a sprint: open (not done) tickets must be relocated first.
  const requestSprintClose = (sprint: BacklogSprint) => {
    const openCount = tickets.filter(
      (t) =>
        t.sprintId === sprint.id &&
        !isDoneStage(t.columnId ? data.columnMap.get(t.columnId) : undefined),
    ).length;
    if (openCount === 0) {
      sprintMutations.complete.mutate({ sprintId: sprint.id, moveTo: null });
      return;
    }
    setCloseMoveTarget("backlog");
    setPendingSprintClose({ sprintId: sprint.id, sprintName: sprint.name, openCount });
  };
  const confirmSprintClose = () => {
    if (!pendingSprintClose) return;
    sprintMutations.complete.mutate(
      {
        sprintId: pendingSprintClose.sprintId,
        moveTo: closeMoveTarget === "backlog" ? null : closeMoveTarget,
      },
      { onSuccess: () => setPendingSprintClose(null) },
    );
  };

  const exportCsv = (name: string, items: BacklogTicket[]) =>
    exportTicketsCsv(name, items, {
      formatDateTime: (v) => tz.formatDateTime(v),
      columnMap: data.columnMap,
      backlogColumn: data.backlogColumn,
      epicNamesByTicket: data.epicNamesByTicket,
      assigneeName: (id) => data.assigneeName(id) ?? "",
      ticketCost: data.ticketCost,
    });

  // Bulk delete hints (the server applies the same rules and reports skipped tickets).
  const completedSprintIds = new Set(
    sprints.filter((s) => s.status === "completed").map((s) => s.id),
  );
  const deletableIds = tickets
    .filter(
      (t) =>
        selectedIds.includes(t.id) && !t.loggedMinutes && !completedSprintIds.has(t.sprintId ?? ""),
    )
    .map((t) => t.id);

  const zoneVisibleIds = (zoneId: string) =>
    visibleZoneItems(zoneId === "backlog" ? backlog : sprintItems(zoneId), ctx).map((t) => t.id);
  const allVisibleIds = [
    ...zoneVisibleIds("backlog"),
    ...sortedSprints.flatMap((s) => zoneVisibleIds(s.id)),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {isKanban ? "Backlog" : "Backlog & Sprints"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeProject.name} ·{" "}
            {isKanban ? "plan and groom your backlog" : "plan your next sprint"}
          </p>
        </div>
      </div>
      <BacklogToolbar
        projectId={project.id}
        isKanban={isKanban}
        canWrite={canWrite}
        data={data}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted((v) => !v)}
        onOpenEpics={() => setEpicsOpen(true)}
      />

      <ManageEpicsDialog projectId={project.id} open={epicsOpen} onOpenChange={setEpicsOpen} />

      <DndContext
        sensors={canWrite ? dnd.sensors : []}
        collisionDetection={backlogCollision}
        onDragStart={dnd.onDragStart}
        onDragOver={dnd.onDragOver}
        onDragEnd={dnd.onDragEnd}
        onDragCancel={dnd.onDragCancel}
      >
        <div className="space-y-3">
          {!isKanban && sprints.length === 0 && (
            <GlassPanel className="p-6 text-center text-sm text-muted-foreground">
              {showCompleted
                ? "No completed sprints available yet."
                : "No sprints yet. Create one to start planning."}
            </GlassPanel>
          )}
          {(isKanban ? [] : sortedSprints).map((sprint) => {
            const items = sprintItems(sprint.id);
            return (
              <SprintSection
                key={sprint.id}
                sprint={sprint}
                items={items}
                ctx={ctx}
                project={project}
                canDrag={dnd.reorderable.some((s) => s.id === sprint.id)}
                previewOffset={dnd.sprintPreviewOffset(sprint.id)}
                onHeight={dnd.registerSprintHeight}
                collapsed={!!collapsed[sprint.id]}
                onToggleCollapse={() => toggleCollapsed(sprint.id)}
                ticketDragging={!!dnd.activeId}
                sprintDragging={!!dnd.activeSprintId}
                onStart={() => sprintMutations.start.mutate(sprint.id)}
                onComplete={() => requestSprintClose(sprint)}
                onEdit={() => setSprintToEdit(sprint)}
                onDelete={() => setSprintToDelete({ id: sprint.id, name: sprint.name })}
                onExport={() => exportCsv(sprint.name, items)}
              />
            );
          })}

          {/* Backlog at the bottom (hidden while viewing completed sprints) */}
          {(isKanban || !showCompleted) && (
            <BacklogSection
              items={backlog}
              ctx={ctx}
              project={project}
              collapsed={backlogCollapsed}
              onToggleCollapse={() => setBacklogCollapsed((v) => !v)}
              ticketDragging={!!dnd.activeId}
              onExport={() => exportCsv("backlog", backlog)}
            />
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTicket && (
            <DragPreview ticket={activeTicket} data={data} selectedIds={selectedIds} />
          )}
        </DragOverlay>
      </DndContext>

      <BulkMoveConfirmDialog
        pending={pendingBulkMove}
        onClose={() => setPendingBulkMove(null)}
        onConfirm={(m) =>
          ticketMutations.bulkMove.mutate(
            { ids: m.ids, sprintId: m.sprintId },
            { onSuccess: selection.clear },
          )
        }
      />

      <CompleteSprintDialog
        pending={pendingSprintClose}
        onClose={() => setPendingSprintClose(null)}
        target={closeMoveTarget}
        onTargetChange={setCloseMoveTarget}
        sprints={sprints}
        pendingSubmit={sprintMutations.complete.isPending}
        onConfirm={confirmSprintClose}
      />

      {canWrite && selectedIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          zoneIds={
            selection.selectionZoneId ? zoneVisibleIds(selection.selectionZoneId) : allVisibleIds
          }
          onSetSelected={(ids) => selection.setSelectedIds(() => ids)}
          isKanban={isKanban}
          sprints={sprints}
          onMove={(sprintId) =>
            ticketMutations.bulkMove.mutate(
              { ids: selectedIds, sprintId },
              { onSuccess: selection.clear },
            )
          }
          onEdit={() => setBulkEditOpen(true)}
          isManager={isManager}
          deletableCount={deletableIds.length}
          blockedCount={selectedIds.length - deletableIds.length}
          deleting={ticketMutations.bulkDelete.isPending}
          onDelete={() =>
            ticketMutations.bulkDelete.mutate(
              { ids: selectedIds, optimisticIds: deletableIds },
              { onSuccess: selection.clear },
            )
          }
          onClear={selection.clear}
        />
      )}

      <BulkEditTicketsDialog
        projectId={project.id}
        ticketIds={selectedIds}
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onDone={selection.clear}
        columns={data.columns}
        sprints={sprints}
      />

      <ConfirmDelete
        open={!!sprintToDelete}
        onOpenChange={(o) => !o && setSprintToDelete(null)}
        title="Delete this sprint?"
        description={`"${sprintToDelete?.name ?? ""}" will be deleted and its tickets moved back to the backlog. This cannot be undone.`}
        onConfirm={() => {
          if (sprintToDelete) sprintMutations.remove.mutate(sprintToDelete.id);
          setSprintToDelete(null);
        }}
      />

      {sprintToEdit && (
        <EditSprintDialog
          projectId={project.id}
          sprint={sprintToEdit}
          open
          onOpenChange={(o) => !o && setSprintToEdit(null)}
        />
      )}

      <TicketDialog
        ticketId={openTicket}
        open={!!openTicket}
        onOpenChange={(o) => !o && setOpenTicket(null)}
      />
    </div>
  );
}
