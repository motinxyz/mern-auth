import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import DatabaseService from "./index.js";
// Mock mongoose with Schema.Types support
vi.mock("mongoose", () => {
    class MockSchema {
        pre;
        methods;
        statics;
        index;
        set;
        virtual;
        static Types;
        constructor() {
            this.pre = vi.fn();
            this.methods = {};
            this.statics = {};
            this.index = vi.fn();
            this.set = vi.fn();
            this.virtual = vi.fn().mockReturnValue({
                get: vi.fn(),
                set: vi.fn(),
            });
        }
    }
    MockSchema.Types = {
        ObjectId: "ObjectId",
        String: String,
        Number: Number,
        Boolean: Boolean,
        Date: Date,
    };
    return {
        default: {
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            connection: {
                on: vi.fn(),
                readyState: 1,
                db: {
                    admin: () => ({
                        ping: vi.fn().mockResolvedValue({ ok: 1 }),
                    }),
                },
            },
            models: {},
            Schema: MockSchema,
            model: vi.fn().mockImplementation((name) => ({
                modelName: name,
                findOne: vi.fn(),
                findById: vi.fn(),
                create: vi.fn(),
                findByIdAndUpdate: vi.fn(),
                findByIdAndDelete: vi.fn(),
                countDocuments: vi.fn(),
            })),
        },
    };
});
describe("DatabaseService", () => {
    let service;
    let mockLogger;
    let mockConfig;
    beforeEach(() => {
        vi.clearAllMocks();
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            fatal: vi.fn(),
            child: vi.fn().mockReturnThis(),
        };
        mockConfig = {
            dbURI: "mongodb://localhost:27017",
            dbName: "test_db",
            dbMaxRetries: 3,
            dbInitialRetryDelayMs: 100,
            dbPoolSize: 100,
            dbMinPoolSize: 10,
            dbMaxIdleTimeMs: 30000,
            dbWaitQueueTimeoutMs: 10000,
            serverSelectionTimeoutMs: 5000,
            socketTimeoutMs: 45000,
            nodeEnv: "test",
            port: 3000,
            apiVersion: "v1",
            serviceName: "test",
        };
        service = new DatabaseService({
            config: mockConfig,
            logger: mockLogger,
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("should create DatabaseService with valid options", () => {
        expect(service).toBeDefined();
        expect(service.users).toBeDefined();
        expect(service.emailLogs).toBeDefined();
        expect(service.auditLogs).toBeDefined();
    });
    it("should throw if config is missing", () => {
        expect(() => new DatabaseService({ logger: mockLogger })).toThrow();
    });
});
//# sourceMappingURL=index.test.js.map