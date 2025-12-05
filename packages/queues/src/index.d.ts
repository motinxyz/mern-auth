import { Job, Queue } from "bullmq";

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

export interface QueueHealth {
  healthy: boolean;
  queueName?: string;
  metrics?: QueueMetrics;
  reason?: string;
}

export interface JobOptions {
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  delay?: number;
  priority?: number;
  jobId?: string;
  removeOnComplete?: boolean | number | { age?: number; count?: number };
  removeOnFail?: boolean | number | { age?: number; count?: number };
}

export declare class QueueProducerService {
  constructor(options: {
    queueName: string;
    connection: any;
    logger: any;
    t: (key: string, options?: any) => string;
    defaultJobOptions?: JobOptions;
  });

  initialize(): Promise<void>;
  addJob(jobName: string, data: any, customOptions?: JobOptions): Promise<Job>;
  getMetrics(): Promise<QueueMetrics | null>;
  getHealth(): Promise<QueueHealth>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
  getQueue(): Queue;
}

export declare class ProducerService {
  constructor(options: {
    queueService: QueueProducerService;
    logger: any;
    t: (key: string, options?: any) => string;
  });

  addJob(jobType: string, data: any, customOptions?: JobOptions): Promise<Job>;
  addJobWithDeduplication(
    jobType: string,
    data: any,
    deduplicationKey: string,
    customOptions?: JobOptions
  ): Promise<Job>;
  addDelayedJob(
    jobType: string,
    data: any,
    delayMs: number,
    customOptions?: JobOptions
  ): Promise<Job>;
  addPriorityJob(
    jobType: string,
    data: any,
    priority: number,
    customOptions?: JobOptions
  ): Promise<Job>;
}