import mongoose, { Document, Schema, Model, ObjectId } from 'mongoose';
import { JobStatus } from '../lib';

// Define interface for Company document

interface JobInterface {
  title: string;
  description: string;
  uniform?: string;
  startTime: Date;
  endTime: Date;
  count: number;
  pricePerHour: number;
  applicationsCount: number;
  selectedCount: number;
  showedCount: number;
  companyId: Schema.Types.ObjectId;
  parentId: string;
  status: `${JobStatus}`;
}

interface Slot {
  startTime: Date;
  endTime: Date;
  count: number;
  pricePerHour: number;
}

interface CreateJobInterface {
  title: string;
  description: string;
  uniform?: string;
  slots: Slot[];
  status: 'draft' | 'active';
}
interface JobDocument extends JobInterface, Document {}

// Define interface for Company model (optional)
interface JobModel extends Model<JobDocument> {}

export { JobDocument, JobModel, CreateJobInterface, Slot, JobInterface };
