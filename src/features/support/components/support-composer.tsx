import { useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CommentEditor,
  commentDocHasContent,
  serializeCommentDoc,
} from "@/features/rich-text/components/comment-editor";
import { normalizeDocumentImagesForStorage } from "@/features/rich-text/lib/document-images";
import { useSendSupportMessage } from "../hooks/use-support-mutations";

/** Message box under a ticket thread: rich text plus one optional image/video attachment. */
export function SupportComposer({ issueId }: { issueId: string }) {
  const [draftDoc, setDraftDoc] = useState<unknown>(null);
  const [composerKey, setComposerKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const attachRef = useRef<HTMLInputElement | null>(null);

  const sendMessage = useSendSupportMessage(issueId, () => {
    setDraftDoc(null);
    setFile(null);
    setComposerKey((k) => k + 1);
  });

  const canSend = commentDocHasContent(draftDoc) || !!file;

  function submitMessage() {
    if (!canSend) return;
    sendMessage.mutate({
      body: serializeCommentDoc(
        normalizeDocumentImagesForStorage(draftDoc ?? { type: "doc", content: [] }),
      ),
      file,
    });
  }

  return (
    <div className="shrink-0 px-8 pb-6 pt-2">
      {file && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ImagePlus className="h-3.5 w-3.5" />
          <span className="line-clamp-1 flex-1">{file.name}</span>
          <button type="button" className="text-destructive" onClick={() => setFile(null)}>
            remove
          </button>
        </div>
      )}
      <input
        ref={attachRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div className="relative">
        <CommentEditor
          key={composerKey}
          members={[]}
          placeholder="Type a message…"
          onChange={setDraftDoc}
          onAttach={() => attachRef.current?.click()}
          className="h-[170px] rounded-2xl border-border/70 bg-background/40 pb-12"
          editorClassName="min-h-0"
        />
        <Button
          type="button"
          size="icon"
          className="absolute bottom-2 right-2 h-9 w-9 shrink-0 rounded-full"
          onClick={submitMessage}
          disabled={sendMessage.isPending || !canSend}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
