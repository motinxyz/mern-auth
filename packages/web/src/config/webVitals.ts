import { onCLS, onLCP, onTTFB, onINP, type Metric } from "web-vitals";
import * as Sentry from "@sentry/react";

/**
 * Core Web Vitals thresholds (Google's recommendations)
 * Good: green, Needs Improvement: yellow, Poor: red
 * Note: FID has been deprecated and replaced by INP in Core Web Vitals
 */
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (replaced FID)
};

/**
 * Get rating based on value and metric type
 */
const getRating = (name: string, value: number) => {
  const threshold = THRESHOLDS[name];
  if (!threshold) return "unknown";
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
};

/**
 * Report a web vital metric to Sentry
 */
const reportToSentry = (metric: Metric) => {
  const { name, value, id } = metric;
  const rating = getRating(name, value);

  // Send as custom measurement
  Sentry.setMeasurement(name, value, name === "CLS" ? "" : "millisecond");

  // Also set as breadcrumb for context
  Sentry.addBreadcrumb({
    category: "web-vitals",
    message: `${name}: ${value.toFixed(name === "CLS" ? 3 : 0)} (${rating})`,
    level: rating === "poor" ? "warning" : "info",
    data: {
      metric: name,
      value,
      rating,
      id,
    },
  });

  // Log in development
  if (import.meta.env.DEV) {
    const color =
      rating === "good" ? "green" : rating === "poor" ? "red" : "orange";
    console.log(
      `%c[Web Vitals] ${name}: ${value.toFixed(name === "CLS" ? 3 : 0)} (${rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }
};

/**
 * Initialize Core Web Vitals tracking
 * Call this once on app startup
 */
export const initWebVitals = () => {
  // Largest Contentful Paint - measures loading performance
  onLCP(reportToSentry);

  // Cumulative Layout Shift - measures visual stability
  onCLS(reportToSentry);

  // Time to First Byte - measures server response time
  onTTFB(reportToSentry);

  // Interaction to Next Paint - measures responsiveness (replaced FID)
  onINP(reportToSentry);
};
