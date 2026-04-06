import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA registration and update handling are managed inside the runtime update prompt.

createRoot(document.getElementById("root")!).render(<App />);
