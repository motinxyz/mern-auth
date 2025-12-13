/**
 * Email Metrics
 * Track email sends, failures, and performance
 */

import { meter } from "../factory.js";

// Total emails sent by type, provider, and status
export const emailSendTotal = meter.createCounter("email_send_total", {
    description: "Total number of emails sent",
});

// Email send duration by type and provider
export const emailSendDuration = meter.createHistogram(
    "email_send_duration_seconds",
    {
        description: "Email send duration in seconds",
        unit: "s",
    }
);

// Email bounces by type and bounce type
export const emailBounceTotal = meter.createCounter("email_bounce_total", {
    description: "Total number of email bounces",
});

// Circuit breaker state for email service
export const emailCircuitBreakerState = meter.createCounter(
    "email_circuit_breaker_events_total",
    {
        description: "Email circuit breaker state changes",
    }
);
