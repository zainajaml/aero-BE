import { type ReactElement } from "react";

export interface MentionMember {
  user_id: string;
  name: string;
}

// Matches http(s):// URLs and bare www. URLs, stopping before trailing punctuation.
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]}'"])/gi;

/** Turn raw text into nodes with clickable links. */
function linkifyText(text: string, keyPrefix: string): Array<string | ReactElement> {
  const out: Array<string | ReactElement> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) out.push(text.slice(lastIndex, match.index));
    const raw = match[0];
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    out.push(
      <a
        key={`${keyPrefix}-l-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {raw}
      </a>,
    );
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

/** Render text with clickable links, highlighting @mentions that match known members. */
export function renderCommentBody(body: string, names: string[]) {
  const sorted = [...new Set(names)].sort((a, b) => b.length - a.length);
  const nodes: Array<string | ReactElement> = [];
  let buffer = "";
  let i = 0;
  let key = 0;
  const flush = () => {
    if (buffer) {
      nodes.push(...linkifyText(buffer, `b${key++}`));
      buffer = "";
    }
  };
  while (i < body.length) {
    if (body[i] === "@") {
      const rest = body.slice(i + 1);
      const match = sorted.find((n) => rest.toLowerCase().startsWith(n.toLowerCase()));
      if (match) {
        flush();
        nodes.push(
          <span
            key={`m-${key++}`}
            className="rounded bg-accent/40 px-1 font-medium text-foreground"
          >
            @{rest.slice(0, match.length)}
          </span>,
        );
        i += 1 + match.length;
        continue;
      }
    }
    buffer += body[i];
    i++;
  }
  flush();
  return nodes;
}
