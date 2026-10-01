import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { Textarea } from "@/shared/ui/textarea";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/utils";

export interface MentionMember {
  user_id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  members: MentionMember[];
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MentionTextarea({
  value,
  onChange,
  members,
  placeholder,
  rows = 2,
  className,
  disabled,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(0); // index of the "@"
  const [active, setActive] = useState(0);

  // The text between the most recent "@" and the caret, if it forms a valid mention query.
  const detectQuery = (text: string, caret: number) => {
    const upto = text.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at === -1) return null;
    // "@" must be at start or preceded by whitespace.
    if (at > 0 && !/\s/.test(text[at - 1])) return null;
    const fragment = upto.slice(at + 1);
    if (/\s/.test(fragment)) return null; // query ended at whitespace
    setAnchor(at);
    return fragment;
  };

  const matches =
    query === null
      ? []
      : members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  const handleChange = (text: string, caret: number) => {
    onChange(text);
    const q = detectQuery(text, caret);
    setQuery(q);
    setActive(0);
  };

  const insertMention = (member: MentionMember) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, anchor);
    const after = value.slice(caret);
    const inserted = `@${member.name} `;
    const next = before + inserted + after;
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      const pos = (before + inserted).length;
      if (el) {
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (query === null || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(matches[active]);
    } else if (e.key === "Escape") {
      setQuery(null);
    }
  };

  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div className="relative flex-1">
      <Textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        onChange={(e) => handleChange(e.target.value, e.target.selectionStart)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
      />
      {query !== null && matches.length > 0 && (
        <div
          ref={listRef}
          className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-64 overflow-auto rounded-lg border border-glass-border bg-popover p-1 shadow-lg"
        >
          {matches.map((m, i) => (
            <button
              key={m.user_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">{initials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

/** Extract the user_ids of project members mentioned (via @Name) in the body. */
export function extractMentions(body: string, members: MentionMember[]): string[] {
  if (!members.length) return [];
  const sorted = [...members].sort((a, b) => b.name.length - a.name.length);
  const found = new Set<string>();
  let i = 0;
  while (i < body.length) {
    if (body[i] === "@" && (i === 0 || /\s/.test(body[i - 1]))) {
      const rest = body.slice(i + 1);
      const match = sorted.find((m) => rest.toLowerCase().startsWith(m.name.toLowerCase()));
      if (match) {
        found.add(match.user_id);
        i += 1 + match.name.length;
        continue;
      }
    }
    i++;
  }
  return [...found];
}
