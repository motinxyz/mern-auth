/// <reference types="vite/client" />

declare module "@auth/i18n/locales/*.json" {
    const value: Record<string, string>;
    export default value;
}
