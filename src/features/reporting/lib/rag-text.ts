import type { CommentSummary, TicketComment } from "../api/reporting.api";

type DocNode = { type?: string; text?: string; attrs?: { label?: unknown }; content?: DocNode[] };

function collectText(node: DocNode, out: string[]): void {
  if (typeof node.text === "string") out.push(node.text);
  else if (node.type === "mention" && typeof node.attrs?.label === "string")
    out.push(`@${node.attrs.label}`);
  for (const child of node.content ?? []) collectText(child, out);
  if (node.type === "paragraph" || node.type === "heading") out.push(" ");
}

/** Plain text of a comment body: serialized TipTap JSON or legacy text/HTML. */
export function commentPlainText(body: string | null | undefined): string {
  if (!body) return "";
  let text = body;
  if (body.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(body) as DocNode;
      if (parsed?.type === "doc") {
        const parts: string[] = [];
        collectText(parsed, parts);
        text = parts.join("");
      }
    } catch {
      /* legacy text that happens to start with "{" */
    }
  }
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortPoint(body: string | null | undefined): string {
  const text = commentPlainText(body);
  if (!text) return "";
  // Keep the first sentence/clause, capped short for point form
  const clause = text.split(/(?<=[.!?])\s/)[0];
  const point = clause.length > 70 ? clause.slice(0, 70).trim() + "…" : clause;
  return point;
}

/** Fallback bullets (newest comments first) when no AI summary is available. */
export function commentPoints(comments: Pick<TicketComment, "body">[], max = 4): string[] {
  return comments
    .map((c) => shortPoint(c.body))
    .filter(Boolean)
    .slice(0, max);
}

export function summaryToText(s: CommentSummary): string {
  const sections: [string, string[]][] = [
    ["Issue", s.issue],
    ["Solution", s.solution],
    ["Next steps", s.nextSteps],
  ];
  return sections
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => `${label}:\n${items.map((i) => `  • ${i}`).join("\n")}`)
    .join("\n");
}
