import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatDocTag, useDocumentTags, type DocumentTag } from "./document-tags";

interface Props {
  value: string;
  onChange: (value: string) => void;
  projectId?: string | null;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  /** Optional external ref to the underlying textarea (auto-grow, focus, …). */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onInput?: (el: HTMLTextAreaElement) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

/**
 * Textarea that supports tagging documents by typing "#". The selected
 * document is stored as a `#[Title](id)` token in the plain text value.
 */
export function DocTagTextarea({
  value,
  onChange,
  projectId,
  placeholder,
  rows = 2,
  className,
  disabled,
  textareaRef,
  onInput,
  onKeyDown,
}: Props) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? innerRef;
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(0);
  const [active, setActive] = useState(0);
  const { data: docs = [] } = useDocumentTags(projectId);

  const detectQuery = (text: string, caret: number) => {
    const upto = text.slice(0, caret);
    const at = upto.lastIndexOf("#");
    if (at === -1) return null;
    if (at > 0 && !/\s/.test(text[at - 1])) return null;
    const fragment = upto.slice(at + 1);
    if (/[\n\]]/.test(fragment)) return null;
    setAnchor(at);
    return fragment;
  };

  const matches =
    query === null
      ? []
      : docs.filter((d) => d.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  const insertTag = (doc: DocumentTag) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, anchor);
    const after = value.slice(caret);
    const inserted = `${formatDocTag(doc)} `;
    onChange(before + inserted + after);
    setQuery(null);
    requestAnimationFrame(() => {
      const pos = (before + inserted).length;
      if (el) {
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (query !== null && matches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertTag(matches[active]);
        return;
      }
      if (e.key === "Escape") {
        setQuery(null);
        return;
      }
    }
    onKeyDown?.(e);
  };

  useLayoutEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div className="relative w-full">
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(detectQuery(e.target.value, e.target.selectionStart));
          setActive(0);
          onInput?.(e.target);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
      />
      {query !== null && matches.length > 0 && (
        <div
          ref={listRef}
          className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-72 overflow-auto rounded-lg border border-glass-border bg-popover p-1 shadow-lg"
        >
          {matches.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertTag(d);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{d.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
