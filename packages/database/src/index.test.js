import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./index.js";
import { config } from "@auth/config";

// Mock mongoose
vi.mock("mongoose", async () => {
  const actualMongoose = await vi.importActual("mongoose");
  return {
    ...actualMongoose,
    default: {
      ...actualMongoose.default,
      connect: vi.fn(),
      disconnect: vi.fn(),
      connection: {
        ...actualMongoose.default.connection,
        on: vi.fn(),
      },
    },
  };
});

describe("Database Connection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should connect to MongoDB with correct URI and options", async () => {
    mongoose.connect.mockResolvedValue(true);
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith(config.dbURI, {
      dbName: config.dbName,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  });

  it("should call mongoose.disconnect on disconnectDB", async () => {
    await disconnectDB();
    expect(mongoose.disconnect).toHaveBeenCalled();
  });
});