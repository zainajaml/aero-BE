import { useMemo, useState } from "react";
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
import { GripVertical } from "lucide-react";
import { useCanWrite } from "@/features/auth/hooks/use-can-write";
import { useProjects } from "@/features/projects/project-context";
import { useTimezone } from "@/features/users/lib/timezone";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { ManageEpicsDialog } from "@/features/tickets/components/epics/manage-epics-dialog";
import { TicketDialog } from "@/features/tickets/components/ticket-dialog/ticket-dialog";
import { GanttAxis } from "../components/gantt-axis";
import { DraggableEpicTicket, EpicDropZone, type RowDrag } from "../components/gantt-dnd";
import { GanttGroupBar } from "../components/gantt-group-bar";
import { GanttHeader } from "../components/gantt-header";
import { GanttTicketRow } from "../components/gantt-ticket-row";
import { useCollapsedGroups } from "../hooks/use-collapsed-groups";
import { useGanttData } from "../hooks/use-gantt-data";
import { useMoveTicketEpic } from "../hooks/use-move-ticket-epic";
import {
  DAY,
  LABEL_W,
  buildModel,
  buildTimelineLookup,
  computeDomain,
  isNoEpicGroup,
  type GanttGroup,
  type GanttTicket,
  type ViewMode,
} from "../lib/gantt-model";
import { ticketSegments, type GanttScale } from "../lib/gantt-scale";

export function GanttView() {
  const { activeProject } = useProjects();
  const tz = useTimezone();
  const [range, setRange] = useState<string>("30");
  const [viewMode, setViewMode] = useState<ViewMode>("sprints");
  const [manageEpicsOpen, setManageEpicsOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  // Viewers see the timeline but cannot drag tickets between epics.
  const canWrite = useCanWrite();
  const { collapsed, toggle } = useCollapsedGroups(activeProject?.id);
  const moveEpic = useMoveTicketEpic();

  const data = useGanttData();
  const timelineFor = useMemo(() => buildTimelineLookup(data), [data]);
  const model = useMemo(() => buildModel(data, viewMode), [data, viewMode]);
  const domain = useMemo(
    () => computeDomain(model, viewMode, range, timelineFor),
    [model, viewMode, range, timelineFor],
  );
  const allTickets = data.flatMap((d) => d.tickets);
  const sprintStatus = new Map(data.flatMap((d) => d.sprints).map((s) => [s.id, s.status]));

  const span = Math.max(domain.max - domain.min, DAY);
  const dayCount = Math.ceil(span / DAY);
  const timelineWidth = Math.max(640, Math.min(dayCount * 22, 5200));
  const scale: GanttScale = {
    pct: (t) => ((t - domain.min) / span) * 100,
    fmtDate: (d) => tz.formatDate(d, { month: "short", day: "numeric" }),
    fmtDateTime: (d) => tz.formatDate(d, { month: "short", day: "numeric", year: "2-digit" }),
    domainMin: domain.min,
  };
  const ticks = Array.from({ length: 9 }, (_, i) => domain.min + (span * i) / 8);

  const parseDragId = (raw: string): [string | null, string] =>
    raw.includes("::") ? (raw.split("::") as [string, string]) : [null, raw];

  const onDragStart = (e: DragStartEvent) => setActiveDragId(parseDragId(String(e.active.id))[1]);

  // Dropping on "No Epic Assigned" removes the source epic link.
  const onDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    if (!e.over) return;
    const [sourceGroupId, ticketId] = parseDragId(String(e.active.id));
    const targetGroupId = String(e.over.id);
    if (!ticketId || sourceGroupId === targetGroupId) return;
    const fromEpicId = sourceGroupId && !isNoEpicGroup(sourceGroupId) ? sourceGroupId : null;
    const toEpicId = !isNoEpicGroup(targetGroupId) ? targetGroupId : null;
    if (fromEpicId === toEpicId) return;
    const ticket = allTickets.find((t) => t.id === ticketId);
    if (ticket) moveEpic.mutate({ ticket, fromEpicId, toEpicId });
  };

  const renderRow = (t: GanttTicket, group: GanttGroup, drag?: RowDrag) => (
    <GanttTicketRow
      key={t.id}
      ticket={t}
      segments={ticketSegments(
        t,
        group,
        timelineFor(t),
        viewMode,
        (id) => sprintStatus.get(id),
        domain.min,
      )}
      scale={scale}
      drag={drag}
      onOpen={setOpenTicketId}
    />
  );

  const activeDragTicket = activeDragId ? allTickets.find((x) => x.id === activeDragId) : null;

  return (
    <div className="flex h-full flex-col gap-4">
      <GanttHeader
        projectName={activeProject?.name ?? null}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        range={range}
        onRangeChange={setRange}
        onManageEpics={activeProject ? () => setManageEpicsOpen(true) : null}
      />

      {model.length === 0 ? (
        <GlassPanel className="p-10 text-center text-sm text-muted-foreground">
          No {viewMode === "sprints" ? "sprints" : "epics"} or tickets to display.
        </GlassPanel>
      ) : (
        <GlassPanel className="min-h-0 flex-1 overflow-auto p-0">
          <DndContext
            sensors={canWrite ? dndSensors : []}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            <div style={{ width: LABEL_W + timelineWidth, minWidth: "100%" }}>
              <GanttAxis ticks={ticks} scale={scale} viewMode={viewMode} />

              {model.map(({ project, groups }) => (
                <div key={project.id} className="border-b border-glass-border last:border-0">
                  <div className="bg-muted/30 py-2">
                    <h2 className="sticky left-0 inline-block px-3 font-display text-sm font-semibold tracking-tight">
                      {project.name}
                    </h2>
                  </div>

                  {groups.map((group) => {
                    const isCollapsed = !!collapsed[group.id];
                    const body = (
                      <>
                        <GanttGroupBar
                          group={group}
                          viewMode={viewMode}
                          scale={scale}
                          timelineFor={timelineFor}
                          collapsed={isCollapsed}
                          onToggle={() => toggle(group.id)}
                        />
                        {!isCollapsed &&
                          (group.tickets.length === 0 ? (
                            <div
                              className="sticky left-0 py-1.5 text-[11px] text-muted-foreground"
                              style={{ paddingLeft: 32 }}
                            >
                              No tickets in this {viewMode === "sprints" ? "sprint" : "epic"}.
                            </div>
                          ) : viewMode === "epics" ? (
                            group.tickets.map((t) => (
                              <DraggableEpicTicket key={t.id} dragId={`${group.id}::${t.id}`}>
                                {(drag) => renderRow(t, group, drag)}
                              </DraggableEpicTicket>
                            ))
                          ) : (
                            group.tickets.map((t) => renderRow(t, group))
                          ))}
                      </>
                    );
                    return viewMode === "epics" ? (
                      <EpicDropZone key={group.id} id={group.id}>
                        {body}
                      </EpicDropZone>
                    ) : (
                      <div key={group.id}>{body}</div>
                    );
                  })}
                </div>
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDragTicket && (
                <div className="flex items-center gap-2 rounded-md border-2 border-dashed border-primary/70 bg-card px-3 py-2 shadow-lg">
                  <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {activeDragTicket.code}
                  </span>
                  <span className="text-xs">{activeDragTicket.title}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </GlassPanel>
      )}

      {activeProject && (
        <ManageEpicsDialog
          projectId={activeProject.id}
          open={manageEpicsOpen}
          onOpenChange={setManageEpicsOpen}
        />
      )}

      <TicketDialog
        ticketId={openTicketId}
        open={!!openTicketId}
        onOpenChange={(open) => {
          if (!open) setOpenTicketId(null);
        }}
      />
    </div>
  );
}
