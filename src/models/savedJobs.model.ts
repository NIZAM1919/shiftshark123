import mongoose, { Schema, Model, model, ObjectId } from 'mongoose';
import { SavedJobDocument, SavedJobModel } from '../interfaces';
import { ApplicationStatus } from '../lib/enums';

const savedJobSchema = new Schema<SavedJobDocument, SavedJobModel>(
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SavedJob = mongoose.model<SavedJobDocument, SavedJobModel>(
  'savedJobs',
  savedJobSchema,
);
export { SavedJob };
