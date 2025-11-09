import { Request, Response, NextFunction, Router } from "express";
import { RateLimitRequestHandler } from "express-rate-limit";
import { AnyZodObject } from "zod";
import { IUser } from "@auth/database";

declare module "@auth/core" {
  // Auth Feature
  export const authRouter: Router;
  export function registerNewUser(
    userData: Pick<IUser, "name" | "email" | "password">,
    locale: string
  ): Promise<IUser>;
  export function verifyUserEmail(token: string): Promise<IUser>;

  // Middleware
  export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void;
  export const httpLogger: any; // pino-http logger instance
  export const authLimiter: RateLimitRequestHandler;
  export function validate(
    schema: AnyZodObject
  ): (req: Request, res: Response, next: NextFunction) => Promise<void>;

  // Token Service
  export function createVerificationToken(user: IUser): Promise<string>;
}