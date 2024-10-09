import mongoose, { Document, Schema, Model } from 'mongoose';
import { ApplicationStatus } from '../lib/enums';

type status = `${ApplicationStatus}`;

interface JobApplicationInterface {
  companyId: Schema.Types.ObjectId;
  parentId: string;
  jobId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  status: status;
  rating?: number;
  startTime?: Date;
  endTime?: Date;
  requestedStartTime: Date;
  requestedEndTime: Date;
  feedback?: string;
  meta?: any;
  amountBilled?: number;
  pricePerHour?: number;
  createdAt?: Date;
  updatedAt?: Date;
  otp?: string;
}

interface JobApplicationDocument extends JobApplicationInterface, Document {}

interface JobApplicationModel extends Model<JobApplicationDocument> {}

export { JobApplicationDocument, JobApplicationModel, JobApplicationInterface };
