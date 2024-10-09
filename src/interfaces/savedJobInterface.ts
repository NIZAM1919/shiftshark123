import mongoose, { Document, Schema, Model } from 'mongoose';
import { ApplicationStatus } from '../lib/enums';

type status = `${ApplicationStatus}`;

interface SavedJobInterface {
  companyId: Schema.Types.ObjectId;
  parentId: string;
  jobId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
}

interface SavedJobDocument extends SavedJobInterface, Document {}

interface SavedJobModel extends Model<SavedJobDocument> {}

export { SavedJobDocument, SavedJobModel, SavedJobInterface };
