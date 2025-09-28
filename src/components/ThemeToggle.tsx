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
      className="flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-gray-600/30 to-gray-700/30 hover:from-gray-500/40 hover:to-gray-600/40 transition-all duration-200 text-gray-200 hover:text-white text-xs font-medium shadow-sm border border-gray-600/30 hover:border-gray-500/50 group"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
    >
      <span className="mr-2 transition-transform group-hover:scale-110">
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
      <span className="transition-all group-hover:tracking-wide">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
};

export default ThemeToggle;
