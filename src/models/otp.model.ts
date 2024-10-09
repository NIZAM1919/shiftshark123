import mongoose, { Document, Schema, Model } from 'mongoose';
import { OTPDocument, OTPModel } from '../interfaces/otpInterface';

// Define Mongoose schema
const OTPSchema = new Schema<OTPDocument, OTPModel>(
  {
    phone: { type: String },
    otp: { type: String },
    email: { type: String },
    verified: { type: Boolean, required: true },
    source: { type: String, enum: ['hirer', 'service-provider'], required: true },
  },
  { timestamps: true, versionKey: false },
);

// Create and export OTP model
const OTP = mongoose.model<OTPDocument, OTPModel>('OTP', OTPSchema);
export { OTP };
