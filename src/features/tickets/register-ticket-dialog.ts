import { registerTicketDialog } from "@/shared/ui/ticket-dialog-slot";
import { TicketDialog } from "./components/ticket-dialog/ticket-dialog";

// Side-effect module: lets report/notification pages open tickets through the shared slot.
registerTicketDialog(TicketDialog);
