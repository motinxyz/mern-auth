import { Redis } from 'ioredis';
import { Logger } from 'pino';
import { i18n, i18nMiddleware } from 'i18next-http-middleware';

export const config: any; // TODO: Define a proper type for config

export const logger: Logger;

export const i18nInstance: i18n;
export const i18nMiddleware: i18nMiddleware;
export function initI18n(): Promise<i18n>;

export let t: (key: string, options?: Record<string, any>) => string;
export const setT: (tFunction: (key: string, options?: Record<string, any>) => string) => void;

export const redisConnection: Redis;