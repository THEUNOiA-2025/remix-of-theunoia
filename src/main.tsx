import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ✅ Import HelmetProvider
import { HelmetProvider } from "react-helmet-async";

// ✅ Wrap App inside HelmetProvider
createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
