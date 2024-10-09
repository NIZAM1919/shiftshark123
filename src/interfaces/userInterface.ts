import mongoose, { Document, Schema, Model } from 'mongoose';

interface UserDocument extends Document {
  name: string;
  email?: string;
  role: 'service-provider' | 'hirer' | 'admin' | 'superAdmin' | 'staff';
  createdAt?: Date;
  password?: string;
  updatedAt?: Date;
  dob?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  jobsCompleted?: number;
  phone?: string;
  avatar?: string;
  idDetails?: {
    PAN?: string;
    aadharNumber?: string;
  };
  additionalDetails?: {
    photoURL?: string;
    skills?: string[];
    resume?: string;
    schoolName?: string;
    aboutMe?: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  onboardingCompleted?: boolean;
  verified?: boolean;
  companyId?: mongoose.Types.ObjectId;
  employeeId?: string;
  designation?: string;
  rating?: Number;
}
interface UserModel extends Model<UserDocument> {}
export { UserDocument, UserModel };
