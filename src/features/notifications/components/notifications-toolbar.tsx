import { AlertTriangle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { PAGE_SIZES } from "../lib/notification-format";

type Props = {
  filter: string;
  onFilterChange: (value: string) => void;
  failedCount: number;
  failedOnly: boolean;
  onToggleFailed: () => void;
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  showPager: boolean;
};

export function NotificationsToolbar({
  filter,
  onFilterChange,
  failedCount,
  failedOnly,
  onToggleFailed,
  total,
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPageChange,
  showPager,
}: Props) {
  return (
    <div className="shrink-0 px-3">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter by type, ticket, title, created by, status…"
            className="pl-8"
          />
        </div>
        {(failedCount > 0 || failedOnly) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFailed}
            aria-pressed={failedOnly}
            className={`h-7 shrink-0 gap-1.5 rounded-full px-3 text-xs ${
              failedOnly
                ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15"
                : "border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {failedCount} failed
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {total === 0
              ? "0 of 0"
              : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  total,
                )} / ${total}`}
          </span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-7 w-[105px] text-xs bg-transparent border-border transition-colors hover:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showPager && (
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-r-none bg-transparent border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="flex h-7 items-center justify-center border-y border-border bg-transparent px-2 text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-l-none bg-transparent border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
