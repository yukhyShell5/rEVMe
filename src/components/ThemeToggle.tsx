import React, { useEffect, useState } from "react";

function getInitialTheme(): "dark" | "light" {
  try {
    const saved = localStorage.getItem("revme-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "light") el.setAttribute("data-theme", "light");
    else el.removeAttribute("data-theme");
    try { localStorage.setItem("revme-theme", theme); } catch {}
  }, [theme]);

  return (
    <button
      className="theme-toggle-btn hover:opacity-100 opacity-90"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
};

export default ThemeToggle;
