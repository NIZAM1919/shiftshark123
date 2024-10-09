import mongoose, { Schema, Model, model, ObjectId } from 'mongoose';
import { JobDocument, JobModel } from '../interfaces';
import { JobStatus } from '../lib';

// Define the schema for the Job document
const jobSchema = new Schema<JobDocument, JobModel>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      required: true,
    },
    uniform: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    count: { type: Number, required: true },
    pricePerHour: { type: Number, required: true },
    applicationsCount: { type: Number, default: 0 },
    selectedCount: { type: Number, default: 0 },
    showedCount: { type: Number, default: 0 },
    companyId: { type: Schema.Types.ObjectId, required: true, ref: 'Company' },
    parentId: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Job = mongoose.model<JobDocument, JobModel>('Job', jobSchema);
export { Job };
