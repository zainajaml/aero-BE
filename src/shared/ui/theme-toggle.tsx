import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/** Shared dark/light theme state backed by localStorage + the `dark` class. */
export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("aero-theme");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aero-theme", next ? "dark" : "light");
  }

  return { dark, toggle };
}

export function ThemeToggle({
  variant = "icon",
  onNavigate,
}: {
  variant?: "icon" | "menu";
  onNavigate?: () => void;
}) {
  const { dark, toggle: toggleTheme } = useTheme();

  function toggle() {
    toggleTheme();
    onNavigate?.();
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all",
          "hover:bg-accent/50 hover:text-foreground",
        )}
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{dark ? "Light Theme" : "Dark Theme"}</span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
