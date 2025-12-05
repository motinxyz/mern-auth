declare module "@auth/email" {
  export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
    userId?: string;
    type?: string;
    metadata?: Record<string, any>;
  }

  export interface EmailHealth {
    healthy: boolean;
    circuitBreaker: {
      initialized: boolean;
      state: "open" | "half-open" | "closed" | "unknown";
      inMemoryStats?: any;
      circuitBreakerStats?: any;
    };
    providers: {
      healthy: boolean;
      providers: Array<{
        name: string;
        healthy: boolean;
        error?: string;
      }>;
    };
  }

  export class EmailService {
    constructor(options: {
      config: any;
      logger: any;
      t: (key: string, options?: any) => string;
      emailLogRepository: any;
    });

    initialize(): Promise<void>;
    sendEmail(options: SendEmailOptions): Promise<any>;
    getCircuitBreakerHealth(): any;
    getProviderHealth(): Promise<any>;
    getHealth(): Promise<EmailHealth>;
  }

  export class ProviderService {
    constructor(options: {
      config: any;
      logger: any;
      t: (key: string, options?: any) => string;
    });

    initialize(): Promise<void>;
    sendWithFailover(mailOptions: any): Promise<any>;
    getHealth(): Promise<any>;
    getProviders(): any[];
  }

  export function sendVerificationEmail(
    emailService: EmailService,
    user: { id: string; name: string; email: string },
    token: string,
    t: (key: string, options?: any) => string,
    config: any,
    logger: any
  ): Promise<any>;

  export function handleBounce(
    emailLogRepository: any,
    userRepository: any,
    logger: any,
    t: (key: string, options?: any) => string,
    bounceData: {
      email: string;
      messageId: string;
      bounceType: "hard" | "soft" | "complaint";
      bounceReason: string;
      timestamp?: Date;
    }
  ): Promise<any>;

  export function isEmailValid(email: string): boolean;

  const _default: {
    EmailService: typeof EmailService;
    ProviderService: typeof ProviderService;
    sendVerificationEmail: typeof sendVerificationEmail;
    handleBounce: typeof handleBounce;
    isEmailValid: typeof isEmailValid;
  };
  export default _default;
}