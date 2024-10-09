import mongoose, { Schema, Model, model, ObjectId } from 'mongoose';
import { InvoiceDocument, InvoiceModel } from '../interfaces';

const invoiceSchema = new Schema<InvoiceDocument, InvoiceModel>(
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
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    amountBilled: {
      type: Number, // for company
      required: true,
    },
    processingFees: {
      type: Number, // for company
      required: true,
    },
    total: {
      type: Number, // for company
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CompanyInvoice = mongoose.model<InvoiceDocument, InvoiceModel>(
  'CompanyInvoice',
  invoiceSchema,
);
export { CompanyInvoice };
