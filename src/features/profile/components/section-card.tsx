import { Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { CTA_BUTTON } from "@/shared/lib/cta";

/** Bordered card with a header, an edit toggle and an optional save footer. */
export function SectionCard({
  icon,
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  saveLabel = "Save",
  editable = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  editing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  editable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/50 bg-transparent p-4">
      <header className="flex items-center gap-2">
        <span className="text-neon-violet">{icon}</span>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {editable && (
          <div className="ml-auto">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCancel}
                aria-label={`Cancel editing ${title}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
                aria-label={`Edit ${title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="mt-3 space-y-3">{children}</div>

      {editing && onSave && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onSave} disabled={saving} className={CTA_BUTTON}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      )}
    </section>
  );
}

/** Stacked label-over-value/field row. */
export function StackField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Read-only value display used when a card is not in edit mode. */
export function ReadValue({ value }: { value?: string | null }) {
  return (
    <p className="truncate text-sm">
      {value?.trim() ? value : <span className="text-muted-foreground/60">Not set</span>}
    </p>
  );
}
