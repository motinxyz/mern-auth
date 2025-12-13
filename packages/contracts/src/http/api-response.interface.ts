/**
 * API Success Response Interface
 *
 * Standard shape for all successful API responses.
 *
 * @example
 * ```typescript
 * const response: IApiResponse<{ user: User }> = {
 *   success: true,
 *   statusCode: 200,
 *   message: "User created",
 *   data: { user: { id: "123", name: "John" } }
 * };
 * ```
 */

export interface IApiResponse<T = unknown> {
    /** Whether the request was successful */
    readonly success: boolean;
    /** HTTP status code */
    readonly statusCode: number;
    /** Response message (can be i18n key) */
    readonly message: string;
    /** Response data payload */
    readonly data: T;
}
