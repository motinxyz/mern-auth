/**
 * API Response Type Union
 *
 * Represents either a success or error response.
 */

import type { IApiResponse } from "./api-response.interface.js";
import type { IApiError } from "./api-error.interface.js";

export type ApiResponseType<T = unknown> = IApiResponse<T> | IApiError;
