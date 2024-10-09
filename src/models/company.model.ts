import mongoose, { Document, Schema, Model } from 'mongoose';
import { CompanyModel, CompanyDocument } from '../interfaces/companyInterface';
// Define Mongoose schema
const CompanySchema = new Schema<CompanyDocument, CompanyModel>(
  {
    name: { type: String, required: true },
    address: { type: String },
    GSTNumber: { type: String, required: true },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
    },
    isNgo: { type: Boolean },
    registrationNumber: { type: String },
    cityName: { type: String, required: true },
    mapLink: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

// Create and export Company model
const Company = mongoose.model<CompanyDocument, CompanyModel>('Company', CompanySchema);
export { Company };
