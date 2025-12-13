import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@features": path.resolve(__dirname, "./src/features"),
            "@shared": path.resolve(__dirname, "./src/shared"),
            "@config": path.resolve(__dirname, "./src/config"),
            "@auth/config/locales": path.resolve(__dirname, "../../packages/config/src/locales"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split React and React DOM into separate chunk
                    "vendor-react": ["react", "react-dom"],
                    // Split React Router
                    "vendor-router": ["react-router-dom"],
                    // Split Sentry (large)
                    "vendor-sentry": ["@sentry/react"],
                    // Split i18n
                    "vendor-i18n": ["i18next", "react-i18next"],
                    // Split other utilities
                    "vendor-utils": ["axios", "zod"],
                },
            },
        },
    },
});
