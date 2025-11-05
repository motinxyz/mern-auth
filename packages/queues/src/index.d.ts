declare module '@auth/queues' {
  export const redisConnection: any; // TODO: Add proper type for redisConnection
  export const emailQueue: any; // TODO: Add proper type for emailQueue
  export function addEmailJob(jobName: string, data: any, opts?: any): Promise<any>; // TODO: Add proper types for addEmailJob
  export * from './queue.constants';
}