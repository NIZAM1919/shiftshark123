import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserDocument, UserModel } from '../interfaces/userInterface';

// Define Mongoose schema
const UserSchema = new Schema<UserDocument, UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String },
    role: {
      type: String,
      enum: ['service-provider', 'hirer', 'admin', 'superAdmin', 'staff'],
      required: true,
    },
    password: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: { type: String },
    phone: { type: String },
    avatar: { type: String },
    jobsCompleted: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    additionalDetails: {
      photoURL: { type: String },
      skills: [{ type: String }],
      resume: { type: String },
      schoolName: { type: String },
      aboutMe: { type: String },
    },
    idDetails: {
      PAN: { type: String },
      aadharNumber: { type: String },
    },
    bankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String },
      bankName: { type: String },
    },
    onboardingCompleted: { type: Boolean },
    verified: { type: Boolean },
    companyId: { type: Schema.Types.ObjectId },
    employeeId: { type: String },
    designation: { type: String },
  },
  { timestamps: true, versionKey: false },
);

// Create and export User model
const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);
export { User };
