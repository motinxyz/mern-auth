import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  normalizedEmail: string;
  password?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  emailValid: boolean;
  emailBounceReason?: string;
  emailBouncedAt?: Date;
  emailComplaint: boolean;
  emailComplaintAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  id: string; // From toJSON transform
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}
