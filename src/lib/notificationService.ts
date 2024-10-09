import Notification from '../models/notification.model';
import mongoose, { Schema, Document } from 'mongoose';

export default class NotificationService {
  private constructor() {}

  private static instance: NotificationService;

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendInAppNotification(
    userIds: mongoose.Types.ObjectId[],
    content: string,
    reffer?: 'application' | 'job',
    refferId?: mongoose.Types.ObjectId,
  ) {
    try {
      const notificationsToInsert = userIds.map((userId) => ({
        userId,
        content,
        reffer,
        refferId,
      }));
      const result = await Notification.insertMany(notificationsToInsert);
    } catch (error) {
      throw error;
    }
  }
}
