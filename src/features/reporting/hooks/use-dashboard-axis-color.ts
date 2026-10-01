import { useEffect, useState } from "react";

/** Chart axis color that follows the theme class on <html> (white in dark, #222 in light). */
export function useDashboardAxisColor(): string {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark ? "#ffffff" : "#222222";
}
