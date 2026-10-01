import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Briefcase, ChevronRight, LogOut, Moon, SlidersHorizontal, Sun, User } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { UserAvatar } from "@/features/users/components/user-avatar";
import { displayName } from "../lib/names";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "@/shared/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

/**
 * Sidebar footer identity card: avatar + name + dropdown holding the theme
 * toggle, profile settings and logout (previously separate sidebar rows).
 */
export function SidebarProfileMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const profile = user;

  const name = displayName(profile, profile?.email ?? "Account");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-2.5 py-2 text-left transition-all",
              "hover:bg-accent/50",
            )}
          >
            <UserAvatar
              path={profile?.avatarUrl}
              name={name}
              className="h-9 w-9"
              fallbackClassName="text-[11px]"
            />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-foreground">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">View profile</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          className="w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              search={{ tab: undefined, view: undefined }}
              onClick={onNavigate}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/my-work"
              search={{ tab: undefined }}
              onClick={onNavigate}
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              <span>My Work</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/preferences" onClick={onNavigate} className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Preferences</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              toggle();
            }}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{dark ? "Light Theme" : "Dark Theme"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmLogout(true)}>
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={signOut}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
