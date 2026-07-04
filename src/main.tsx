import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initSecurity } from './utils/security';

// Initialize frontend security (devtools blocker, anti-hack)
initSecurity();

createRoot(document.getElementById("root")!).render(<App />);
