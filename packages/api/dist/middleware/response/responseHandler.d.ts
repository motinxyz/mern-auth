import type { Request, Response, NextFunction } from "express";
interface ResponseLocals {
    data?: {
        statusCode: number;
        data: unknown;
        message: string;
    };
}
type RequestWithT = Request & {
    t: (key: string) => string;
};
/**
 * Middleware to handle successful responses.
 * It checks for data in `res.locals.data` and sends a standardized JSON response.
 */
export declare const responseHandler: (req: RequestWithT, res: Response<unknown, ResponseLocals>, next: NextFunction) => void;
export {};
//# sourceMappingURL=responseHandler.d.ts.map