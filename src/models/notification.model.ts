import mongoose, { Document, Schema } from 'mongoose';
import { INotification } from '../interfaces/notificationInterface';

// Extend INotification interface with Document from mongoose
export interface INotificationModel extends INotification, Document {}

// Define the Notification schema
const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Company', // Assuming there's a Company model to reference
    },
    content: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      default: 'default',
    },
    read: {
      type: Boolean,
      default: false,
    },
    reffer: {
      type: String,
      enum: ['job', 'application'],
    },
    refferId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Export the model
export default mongoose.model<INotificationModel>('Notification', NotificationSchema);
