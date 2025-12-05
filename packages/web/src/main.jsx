import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initSentry } from "./config/sentry";
import { initWebVitals } from "./config/webVitals";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";

// Initialize observability
initSentry();
initWebVitals();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
