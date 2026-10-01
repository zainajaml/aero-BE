import { formatHM } from "@/shared/lib/format";
import type { CommentSummary, RagRow, TicketComment } from "../api/reporting.api";
import { commentPoints, summaryToText } from "./rag-text";

export type RagExportInput = {
  rows: RagRow[];
  reportTitle: string;
  sprintName: string;
  projectKey: string | null | undefined;
  summaries: Record<string, CommentSummary | null>;
  commentsByTicket: Record<string, TicketComment[]>;
};

export async function downloadRagPdf(input: RagExportInput): Promise<void> {
  const { rows, reportTitle, sprintName, projectKey, summaries, commentsByTicket } = input;
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text(reportTitle, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`${sprintName} · Generated ${new Date().toLocaleString()}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Ticket", "Budget (logged / est)", "RAG", "Sprint state", "Comment summary"]],
    body: rows.map((r) => {
      const ai = summaries[r.ticketId];
      const summaryText = ai
        ? summaryToText(ai)
        : commentPoints(commentsByTicket[r.ticketId] ?? [])
            .map((p) => `• ${p}`)
            .join("\n");
      return [
        `${r.code}  ${r.title}`,
        r.estimateMinutes
          ? `${formatHM(r.loggedMinutes)} / ${formatHM(r.estimateMinutes)} (${r.pctSpent}%)`
          : `${formatHM(r.loggedMinutes)} / —`,
        r.status.toUpperCase(),
        r.stageName,
        `${r.commentCount} comment(s)` + (summaryText ? `\n${summaryText}` : ""),
      ];
    }),
    styles: { fontSize: 8, cellPadding: 2, valign: "top", overflow: "linebreak" },
    headStyles: { fillColor: [30, 30, 40] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 45 },
      2: { cellWidth: 18 },
      3: { cellWidth: 30 },
      4: { cellWidth: 120 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = rows[data.row.index]?.status;
        if (v === "red") data.cell.styles.textColor = [200, 40, 40];
        else if (v === "orange") data.cell.styles.textColor = [200, 130, 20];
        else data.cell.styles.textColor = [40, 150, 60];
      }
    },
  });

  doc.save(`rag-status-${(projectKey ?? "report").toLowerCase()}.pdf`);
}

export function shareRagByEmail(rows: RagRow[], reportTitle: string, sprintName: string): void {
  const lines = rows.map(
    (r) =>
      `• [${r.status.toUpperCase()}] ${r.code} ${r.title}\n` +
      `   Budget: ${formatHM(r.loggedMinutes)} / ${r.estimateMinutes ? formatHM(r.estimateMinutes) : "—"}` +
      `${r.estimateMinutes ? ` (${r.pctSpent}%)` : ""} · State: ${r.stageName} · ${r.commentCount} comment(s)`,
  );
  const counts = (["red", "orange", "green"] as const)
    .map((s) => `${s}: ${rows.filter((r) => r.status === s).length}`)
    .join(", ");
  const subject = `${reportTitle} (${sprintName})`;
  const body =
    `${reportTitle}\n${sprintName} — generated ${new Date().toLocaleString()}\n\n` +
    `Summary — ${counts}\n\n${lines.join("\n\n")}`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
