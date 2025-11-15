import mongoose, { Model } from "mongoose";
import { IUser } from "./models/user.model";

export declare function connectDB(): Promise<void>;
export declare function disconnectDB(): Promise<void>;
export declare const User: Model<IUser>;
export { mongoose };
