import { Request, Response, NextFunction, Router } from "express";
import { RateLimitRequestHandler } from "express-rate-limit";
import { AnyZodObject, ZodSchema } from "zod";
import { IUser } from "@auth/database";
import { AwilixContainer } from "awilix";

declare module "@auth/core" {
  // --- Services ---
  export class RegistrationService {
    registerUser(userData: any, locale?: string): Promise<IUser>;
  }

  export class VerificationService {
    verifyEmail(token: string): Promise<IUser>;
  }

  export class TokenService {
    createVerificationToken(user: IUser): Promise<string>;
    verifyToken(token: string, type: string): Promise<string>;
  }

  // --- Controllers ---
  export class RegistrationController {
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
  }

  export class VerificationController {
    verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
  }

  // --- Instances ---
  export const registrationController: RegistrationController;
  export const verificationController: VerificationController;
  export const registrationService: RegistrationService;
  export const verificationService: VerificationService;

  // --- DTOs ---
  export class RegistrationDto {
    constructor(data: any);
    name: string;
    email: string;
    password: string;
  }

  export class VerificationDto {
    constructor(data: any);
    token: string;
  }

  // --- Validators ---
  export const registrationSchema: ZodSchema;
  export const verificationSchema: ZodSchema;

  // --- Container ---
  export const container: AwilixContainer;
}