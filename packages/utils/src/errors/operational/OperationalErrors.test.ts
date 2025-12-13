import { describe, it, expect } from "vitest";
import {
    ConfigurationError,
    EnvironmentError,
    DatabaseConnectionError,
    RedisConnectionError,
    EmailDispatchError,
    EmailServiceInitializationError,
    TokenCreationError,
    QueueError,
    JobCreationError,
    UnknownJobTypeError,
    InvalidJobDataError,
} from "../../index.js";
import { ERROR_CODES } from "../../index.js";
import { BaseError } from "../base/BaseError.js";

describe("Operational Errors", () => {
    // Simple errors that just take a message
    const simpleErrors = [
        { Class: ConfigurationError, code: ERROR_CODES.CONFIGURATION_ERROR },
        { Class: DatabaseConnectionError, code: ERROR_CODES.DATABASE_ERROR },
        { Class: RedisConnectionError, code: ERROR_CODES.REDIS_ERROR },
        { Class: EmailDispatchError, code: ERROR_CODES.EMAIL_ERROR },
        { Class: EmailServiceInitializationError, code: ERROR_CODES.CONFIGURATION_ERROR },
        { Class: TokenCreationError, code: ERROR_CODES.INTERNAL_ERROR },
        { Class: JobCreationError, code: ERROR_CODES.JOB_FAILED },
        { Class: InvalidJobDataError, code: ERROR_CODES.INVALID_JOB_DATA },
    ];

    simpleErrors.forEach(({ Class, code }) => {
        it(`should instantiate ${Class.name} with correct code`, () => {
            const error = new Class("Test Message");
            expect(error).toBeInstanceOf(BaseError);
            expect(error.message).toBe("Test Message");
            expect(error.code).toBe(code);
            expect(error.toJSON()).toBeDefined();
        });
    });

    // Complex errors with extra arguments
    it("should instantiate EnvironmentError", () => {
        const error = new EnvironmentError("Msg", ["VAR"]);
        expect(error.code).toBe(ERROR_CODES.ENVIRONMENT_ERROR);
        expect(error.toJSON()).toBeDefined();
    });

    it("should instantiate QueueError", () => {
        const error = new QueueError("MyQueue", "Msg");
        expect(error.code).toBe(ERROR_CODES.JOB_FAILED);
        expect(error.queueName).toBe("MyQueue");
        expect(error.message).toBe("Msg");
        expect(error.toJSON()).toMatchObject({ queueName: "MyQueue" });
    });

    it("should instantiate UnknownJobTypeError", () => {
        const error = new UnknownJobTypeError("MyType", "Msg");
        expect(error.code).toBe(ERROR_CODES.UNKNOWN_JOB_TYPE);
        expect(error.jobType).toBe("MyType");
        expect(error.toJSON()).toMatchObject({ jobType: "MyType" });
    });
});
