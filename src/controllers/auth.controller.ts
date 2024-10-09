import { NextFunction, Request, Response } from 'express';
import {
  createAcessToken,
  createRefreshToken,
  verifyToken,
  createShortLivedToken,
  jsonOne,
  HttpError,
  hashPassword,
  comparePasswords,
  sendOTP,
} from '../util';
import { Constants } from '../lib';
import { OTP, User } from '../models';
import { OTPDocument, UserDocument } from '../interfaces';
import Logging from '../lib/logging';

export const sendOTPController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { phone, email, source } = req.body;
  Logging.info(req.body);
  let otp = Math.floor(100000 + Math.random() * 900000).toString();

  if (process.env.NODE_ENV != 'production') {
    otp = '123456';
  }
  const hashedOTP = await hashPassword(otp);
  const otpDoc: OTPDocument = new OTP({
    phone,
    email,
    otp: hashedOTP,
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    source,
  });
  await otpDoc.save();
  const otpResponse = await sendOTP(otp, phone, email);
  if (!otpResponse.success) {
    return res.status(500).json({
      success: false,
      message: 'Our servers encountered an error. Please try again later.',
    });
  }
  jsonOne(res, 200, {
    requestId: otpDoc._id,
  });
};
export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId, otp } = req.body;
    const otpDoc: OTPDocument = await OTP.findById(requestId);
    if (!otpDoc) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid Request',
      });
    }
    if (otpDoc.verified) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
      return res.status(400).json({
        success: false,
        message: 'OTP already verified',
      });
    }
    if (!comparePasswords(otp, otpDoc.otp)) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }
    if (new Date().getTime() - otpDoc.createdAt.getTime() > 5 * 60 * 1000) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }
    await OTP.updateOne({ _id: requestId }, { verified: true, updatedAt: new Date() });
    const or = [];
    if (otpDoc.email) {
      or.push({
        email: otpDoc.email,
      });
    } else
      or.push({
        phone: otpDoc.phone,
      });
    const userDoc: UserDocument = await User.findOne(
      { $or: or },
      { name: 1, email: 1, role: 1, createdAt: 1, updatedAt: 1, dob: 1 },
    );

    if (userDoc) {
      const accessToken = createAcessToken({
        userId: String(userDoc._id),
        role: userDoc.role,
      });
      const refreshToken = createRefreshToken({
        userId: String(userDoc._id),
        role: userDoc.role,
      });
      jsonOne(res, 200, {
        newUser: false,
        accessToken,
        refreshToken,
        user: userDoc,
      });
    } else {
      const requestToken = createShortLivedToken({
        phone: otpDoc.phone,
        email: otpDoc.email,
        source: otpDoc.source,
      });
      jsonOne(res, 200, {
        newUser: true,
        requestToken,
      });
    }
  } catch (err) {
    next(err);
  }
};

export const renewToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const data: any = await verifyToken(refreshToken, 'refresh');
    if (!data || data.type != 'refresh') {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }

    const accessToken = createAcessToken({
      userId: String(data.userId),
      role: data.role,
    });
    const newRefreshToken = createRefreshToken({
      userId: String(data.userId),
      role: data.role,
    });
    jsonOne(res, 200, {
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};
