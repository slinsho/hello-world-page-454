import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// vite-plugin-pwa handles SW registration automatically — no manual registration needed.
// The PWAUpdatePrompt component manages the update UX.

createRoot(document.getElementById("root")!).render(<App />);
