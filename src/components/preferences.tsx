"use client";
import { useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
const subscribe = () => () => {};
export function Preferences() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [theme, setTheme] = useState("");
  const activeTheme =
    theme || (ready ? document.documentElement.dataset.theme : "dark");
  function changeTheme() {
    const next = activeTheme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    setTheme(next);
  }
  return (
    <div className="preferences">
      <button
        type="button"
        className="icon-button"
        onClick={changeTheme}
        aria-label={`Switch to ${activeTheme === "light" ? "dark" : "light"} theme`}
      >
        {activeTheme === "light" ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </div>
  );
}
