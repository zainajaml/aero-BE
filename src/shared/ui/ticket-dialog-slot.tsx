import type { ComponentType } from "react";

/**
 * Seam for opening a ticket from report/notification pages without importing the tickets feature's
 * internals. The tickets feature registers its dialog once (e.g. in its module or the app shell):
 *   registerTicketDialog(TicketDialog)
 * Until something is registered, the slot renders nothing (clicks are a no-op).
 */
export type TicketDialogSlotProps = {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
};

let Registered: ComponentType<TicketDialogSlotProps> | null = null;

export function registerTicketDialog(component: ComponentType<TicketDialogSlotProps>): void {
  Registered = component;
}

export function TicketDialogSlot(props: TicketDialogSlotProps) {
  if (!Registered || !props.open) return null;
  const Dialog = Registered;
  return <Dialog {...props} />;
}
