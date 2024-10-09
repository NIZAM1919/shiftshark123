import { Schema, Document, Types } from 'mongoose';

export interface INotification {
  userId: Types.ObjectId;
  content: String;
  class: String; /// enum to classify notifications
  createdAt: Date;
  updatedAt: Date;
  read: boolean;
}
