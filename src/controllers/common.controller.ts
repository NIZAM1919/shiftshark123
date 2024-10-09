import { NextFunction, Response } from 'express';
import { RequestWithCompany, RequestWithUser } from '../interfaces/request';
import { uploadToS3Bucket } from '../util/s3';
import notification from '../models/notification.model';
import mongoose from 'mongoose';
import {
  createAcessToken,
  createRefreshToken,
  verifyToken,
  getPageOptions,
  HttpError,
  jsonOne,
  isEditAllowedWithRespectToTime,
  startShiftForEmployee,
  endShiftForEmployee,
} from '../util';

const uploadFile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { fileBinary, fileSource } = req.body;
    const resp = await uploadToS3Bucket(fileBinary, fileSource);
    res.status(200).json({ success: true, data: resp });
  } catch (error) {
    next(error);
  }
};
const getNotifications = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    let limit = req.query.limit ? Number(req.query.limit) : 20;

    let page = req.query.page ? Number(req.query.page) : 1;
    limit = limit > 50 ? 50 : limit;
    const skipCount = (page - 1) * limit;

    const data: any = await notification
      .find({ userId: { $in: [req.user._id, req.company._id] } })
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(limit)
      .lean();

    return jsonOne(res, 200, data);
  } catch (error) {
    next(error);
  }
};
const getUnreadNotifications = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    let limit = req.query.limit ? Number(req.query.limit) : 20;

    let page = req.query.page ? Number(req.query.page) : 1;
    limit = limit > 50 ? 50 : limit;
    const skipCount = (page - 1) * limit;

    const data: any = await notification
      .find({ userId: { $in: [req.user._id, req.company._id] }, read: false })
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(limit)
      .lean();

    return jsonOne(res, 200, data);
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    let query = {};
    if (req.params.id) {
      query = {
        _id: new mongoose.Types.ObjectId(req.params.id),
      };
    }
    const data = await notification.updateMany(
      {
        ...query,
        userId: { $in: [req.user._id, req.company._id] },
      },
      {
        read: true,
      },
    );

    return jsonOne(res, 200, data);
  } catch (error) {
    next(error);
  }
};
export default {
  uploadFile,
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
};
