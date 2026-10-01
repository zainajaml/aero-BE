import { useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useCanWrite } from "@/features/auth/hooks/use-can-write";
import { useProjects } from "@/features/projects/project-context";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { TicketCard } from "@/features/tickets/components/ticket-card";
import { TicketDialog } from "@/features/tickets/components/ticket-dialog/ticket-dialog";
import { BoardColumn } from "../components/board-column";
import { BoardHeader } from "../components/board-header";
import { useBoardData } from "../hooks/use-board-data";
import { boardCollision, useBoardDnd } from "../hooks/use-board-dnd";
import { useMoveBoardTicket } from "../hooks/use-move-board-ticket";
import { sortBoardTickets } from "../lib/board-sort";
import {
  EMPTY_BOARD_FILTERS,
  type BoardFilters,
  type BoardTicket,
  type SortKey,
} from "../lib/board-types";

export function BoardView() {
  const { activeProject } = useProjects();
  // Viewers may read the board but never move cards or manage columns.
  const canWrite = useCanWrite();
  const projectId = activeProject?.id;
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [sprintFilter, setSprintFilter] = useState<string>("active");
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_BOARD_FILTERS);
  const [sortBy, setSortBy] = useState<SortKey>("manual");

  const data = useBoardData(projectId);
  const { columns, sprints, tickets, defaultStageColId } = data;
  const move = useMoveBoardTicket(projectId);
  const dnd = useBoardDnd(tickets, defaultStageColId, move);

  if (!activeProject) {
    return (
      <GlassPanel className="p-10 text-center">
        <p className="text-muted-foreground">Select or create a project to view the board.</p>
      </GlassPanel>
    );
  }

  const isKanban = activeProject.projectType === "kanban";
  const q = filters.search.trim().toLowerCase();
  const activeSprintIds = sprints.filter((s) => s.status === "active").map((s) => s.id);
  const filtered = tickets.filter((t: BoardTicket) => {
    if (q) {
      const matches =
        (t.code ?? "").toLowerCase().includes(q) || (t.title ?? "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(t.type ?? "task")) return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority ?? "medium"))
      return false;
    if (filters.reporters.length > 0 && !filters.reporters.includes(t.reporterId ?? ""))
      return false;
    if (isKanban) return true;
    if (sprintFilter === "active") return activeSprintIds.includes(t.sprintId ?? "");
    return t.sprintId === sprintFilter;
  });
  const activeTicket = dnd.activeId ? tickets.find((t) => t.id === dnd.activeId) : null;

  return (
    <div className="flex h-[calc(100vh-2.5rem)] min-w-0 flex-col gap-4">
      <BoardHeader
        project={{ id: activeProject.id, key: activeProject.key }}
        isKanban={isKanban}
        canWrite={canWrite}
        columns={columns}
        sprints={sprints}
        reporterOptions={data.reporterOptions}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sprintFilter={sprintFilter}
        onSprintFilterChange={setSprintFilter}
      />

      {columns.length === 0 ? (
        <GlassPanel className="p-10 text-center text-sm text-muted-foreground">
          No columns yet. Click "Manage columns" to add some.
        </GlassPanel>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <DndContext
            sensors={canWrite ? dnd.sensors : []}
            collisionDetection={boardCollision}
            onDragStart={dnd.onDragStart}
            onDragOver={dnd.onDragOver}
            onDragEnd={dnd.onDragEnd}
            onDragCancel={dnd.onDragCancel}
          >
            <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
              {columns.map((col) => {
                const stageMatch = filters.stages.length === 0 || filters.stages.includes(col.id);
                const colTickets = sortBoardTickets(
                  stageMatch
                    ? filtered.filter(
                        (t) =>
                          t.columnId === col.id || (!t.columnId && col.id === defaultStageColId),
                      )
                    : [],
                  sortBy,
                  "asc",
                  data.epicMap,
                );
                // Hide the actively-dragged card from its source list (shown in overlay).
                const display = colTickets.filter((t) => t.id !== dnd.activeId);
                return (
                  <div key={col.id} className="h-full w-80 shrink-0">
                    <BoardColumn
                      col={col}
                      tickets={display}
                      onCardClick={setOpenTicket}
                      showDragHandle={sortBy === "manual"}
                      placeholderIndex={dnd.placeholderIndexFor(col.id, display)}
                      dragActive={!!dnd.activeId}
                    />
                  </div>
                );
              })}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeTicket && (
                <TicketCard
                  ticket={activeTicket}
                  className="rotate-2 border-2 border-dashed border-neon-amber shadow-2xl"
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <TicketDialog
        ticketId={openTicket}
        open={!!openTicket}
        onOpenChange={(o) => !o && setOpenTicket(null)}
      />
    </div>
  );
}
