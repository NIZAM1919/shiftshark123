import mongoose, { Document, Schema, Model } from 'mongoose';

// Define interface for OTP document
interface OTPDocument extends Document {
  phone?: string;
  otp?: string;
  email?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  source: 'hirer' | 'service-provider';
}

// Define interface for OTP model (optional)
interface OTPModel extends Model<OTPDocument> {}

export { OTPDocument, OTPModel };
