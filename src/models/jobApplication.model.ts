import mongoose, { Schema, Model, model, ObjectId } from 'mongoose';
import { JobApplicationDocument, JobApplicationModel } from '../interfaces';
import { ApplicationStatus } from '../lib/enums';

const applicationSchema = new Schema<JobApplicationDocument, JobApplicationModel>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    parentId: {
      type: String,
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Job',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      required: true,
    },
    rating: {
      type: Number,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    requestedStartTime: {
      type: Date,
      required: true,
    },
    requestedEndTime: {
      type: Date,
      required: true,
    },
    feedback: {
      type: String,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
    amountBilled: {
      type: Number, // for student
    },
    pricePerHour: {
      type: Number,
    },
    otp: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const JobApplication = mongoose.model<JobApplicationDocument, JobApplicationModel>(
  'JobApllication',
  applicationSchema,
);
export { JobApplication };
