// Applies the saved theme before first paint (dark by default) to avoid a flash.
try {
  if (localStorage.getItem("aero-theme") === "light")
    document.documentElement.classList.remove("dark");
  else document.documentElement.classList.add("dark");
} catch {
  /* storage unavailable: keep the dark default */
}
