import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { DuplicateImport } from "../hooks/use-jira-import-runner";

type Props = {
  duplicate: DuplicateImport | null;
  onClose: () => void;
  onChooseAnother: () => void;
  onRefresh: () => void;
};

/** Already imported — offer a manual one-way refresh instead of a duplicate. */
export function DuplicateImportDialog({ duplicate, onClose, onChooseAnother, onRefresh }: Props) {
  return (
    <Dialog open={!!duplicate} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>This Jira project has already been imported</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{duplicate?.name}</span> already exists in
            this SpaceScope account
            {duplicate?.tickets ? ` with ${duplicate.tickets} ticket(s)` : ""}. Would you like to
            refresh it with the latest data from Jira?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" size="sm" className="rounded-full" onClick={onChooseAnother}>
            Choose another project
          </Button>
          <Button size="sm" className="rounded-full" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh from Jira
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
