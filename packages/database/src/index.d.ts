import { Mongoose, Model } from "mongoose";
import { IUser } from "./models/user.model.js";

declare module "@auth/database" {
  export const connectDB: () => Promise<void>;
  export const disconnectDB: () => Promise<void>;
  export const User: Model<IUser>;

  const mongoose: Mongoose;
  export default mongoose;
}