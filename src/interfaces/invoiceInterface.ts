import mongoose, { Document, Schema, Model } from 'mongoose';

interface InvoiceDocument extends Document {
  companyId: Schema.Types.ObjectId;
  parentId: string;
  jobId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  amountBilled: number;
  processingFees: number;
  total: number;
  pricePerHour: number;
  createdAt?: Date;
  updatedAt?: Date;
  
}

interface InvoiceModel extends Model<InvoiceDocument> {}

export { InvoiceDocument, InvoiceModel };
