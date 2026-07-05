import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme before first paint to avoid flash.
try {
  const t = localStorage.getItem("lprop-theme");
  const root = document.documentElement;
  if (t === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
    root.classList.remove("light");
  }
} catch {}

// PWA registration and update handling are managed inside the runtime update prompt.

createRoot(document.getElementById("root")!).render(<App />);
