import mongoose, { Document, Schema, Model } from 'mongoose';

// Define interface for Company document
interface CompanyDocument extends Document {
  name: string;
  address?: string;
  GSTNumber: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  isNgo?: boolean;
  registrationNumber?: string;
  cityName: string;
  mapLink: string;
}

// Define interface for Company model (optional)
interface CompanyModel extends Model<CompanyDocument> {}

export { CompanyDocument, CompanyModel };
