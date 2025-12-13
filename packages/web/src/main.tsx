import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initSentry } from "./config/sentry";
import { initWebVitals } from "./config/webVitals";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";

// Initialize observability
initSentry();
initWebVitals();

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Root element not found");
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
