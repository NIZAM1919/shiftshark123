import { S3 } from 'aws-sdk';
import { HttpError } from './httpError';
import * as jwt from 'jsonwebtoken';
import { OTP } from '../models/otp.model';
import { compare } from 'bcrypt';
import { OTPDocument } from '../interfaces';

export type APIResponse<Res> = {
  data: Res[];
  meta: {
    total: number;
    limit: number;
    totalPages: number;
    currentPage: number;
  };
};

const s3Bucket = new S3({ params: { Bucket: process.env.BUCKET_NAME } });

//SEND RESPONSE FOR LIST
const jsonAll = function <Res>(
  res: any,
  status: number,
  data: Res | Array<Res>,
  meta: Object = {},
): APIResponse<Res> {
  return res.status(status).json({
    success: status > 202 ? false : true,
    data: data,
    meta: {
      ...meta,
    },
  });
};

//SEND RESPONSE FOR DETAIL
const jsonOne = function <Res>(res: any, status: number, data: Res): Res {
  return res.status(status).json({
    success: status > 201 ? false : true,
    data,
  });
};

function guidGenerator() {
  const S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

const uploadToS3Bucket = async (
  fileBinary: string,
  folderName: string,
): Promise<string> => {
  const mimeType: string = fileBinary.split(';')[0].split('/')[1];
  const base64Data: Buffer = Buffer.from(
    fileBinary.replace(/^data:.*\/\w+;base64,/, ''),
    'base64',
  );

  const mimeToExtensionMap: Record<string, string> = {
    msword: 'doc',
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'vnd.openxmlformats-officedocument.wordprocessingml.template': 'dotx',
    'vnd.ms-word.document.macroEnabled.12': 'docm',
    'vnd.ms-word.template.macroEnabled.12': 'dotm',
  };

  const fileExtension: string = mimeToExtensionMap[mimeType] || mimeType;

  const path: string = `${folderName}/`;
  const fileName: string = guidGenerator(); // Assuming guidGenerator is defined somewhere
  const fullKey: string = `${path}${fileName}.${fileExtension}`;

  let contentType: string;
  if (mimeType === 'application/pdf') {
    contentType = 'application/pdf';
  } else if (['jpeg', 'jpg', 'png', 'gif'].includes(mimeType)) {
    contentType = `image/${mimeType}`;
  } else {
    contentType = `application/${mimeType}`;
  }

  const data: S3.Types.PutObjectRequest = {
    Key: fullKey,
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: contentType,
    Bucket: process.env.BUCKET_NAME,
  };

  const resp: S3.Types.PutObjectOutput = await s3Bucket.putObject(data).promise();
  return `${process.env.BUCKET_URL}${fullKey}`;
};

// USED TO GENERATE JWT WITH PAYLOAD AND OPTIONS AS PARAMETERS.
// THE PAYLOAD CONTAINS THE DATA WHICH WILL BE SET AS JWT PAYLOAD.
// OPTIONS CONTAIN JWT OPTIONS
const generateJWT = function (
  payload: object = {},
  options: object = {},
  expiresIn: string = '1h',
  refresh: boolean = false,
): string {
  const privateKey: any = refresh
    ? process.env.JWT_SECRET_REFRESH
    : process.env.JWT_SECRET;
  const defaultOptions: object = {
    expiresIn,
  };

  return jwt.sign(payload, privateKey, Object.assign(defaultOptions, options));
};

// USED TO GENERATE JWT WITH PAYLOAD AND OPTIONS AS PARAMETERS.
// THE PAYLOAD CONTAINS THE DATA WHICH WILL BE SET AS JWT PAYLOAD.
// OPTIONS CONTAIN JWT OPTIONS
const generateForgotPasswordJWT = function (
  password: string,
  payload: object = {},
  options: object = {},
): string {
  const privateKey: any = process.env.JWT_SECRET + password;
  const defaultOptions: object = {
    expiresIn: '1h',
  };

  return jwt.sign(payload, privateKey, Object.assign(defaultOptions, options));
};

//VALIDATE ACCESS/REFRESH TOKEN
const validateToken = function (token: string): any {
  try {
    const publicKey: any = process.env.JWT_SECRET;
    return jwt.verify(token, publicKey);
  } catch (e) {
    throw new HttpError({
      title: 'invalid_token',
      detail: 'Your session has expired, please login again',
      code: 400,
    });
  }
};

const validateRefreshToken = function (token: string): any {
  try {
    const publicKey: any = process.env.JWT_SECRET_REFRESH;
    return jwt.verify(token, publicKey);
  } catch (e) {
    throw new HttpError({
      title: 'invalid_token',
      detail: 'Your session has expired, please login again',
      code: 400,
    });
  }
};

//VALIDATE FORGOT PASSWORD ACCESS TOKEN
const validateForgotPasswordJWT = function (password: string, token: string): Object {
  try {
    const publicKey: any = process.env.JWT_SECRET + password;
    return jwt.verify(token, publicKey);
  } catch (e) {
    throw new HttpError({
      title: 'invalid_token',
      detail: 'Password reset link was expired',
      code: 400,
    });
  }
};

//USED TO GENERATE JWT WITH PAYLOAD AND OPTIONS AS PARAMETERS.
const extractToken = function (token: string): string | null {
  if (token?.startsWith('Bearer ')) {
    return token.slice(7, token.length);
  }
  return null;
};

//GENERATE RANDOM PASSWORD
const generateRandomPassword = function (len: number): string {
  const randomString = 'abcdefghijklmnopqrstuvwxyzBCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let password: string = '';
  for (let index = 0; index < len; index++) {
    password += randomString[Math.ceil(Math.random() * (randomString.length - 1))];
  }

  return password;
};

//GENERATE OTP
const generateOtp = function (len: number): string {
  let OTP = '';
  if (process.env.NODE_ENV != 'production') {
    for (let i = 1; i <= len; i++) {
      OTP += i;
    }
    return OTP;
  }
  const digits = '0123456789';

  for (let i = 0; i < len; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  return OTP;
};

//VERIFY GENERATED OTP
const verifyOtp = async function (id: string, otp: string, type: string): Promise<any> {
  let existOtp: OTPDocument = await OTP.findOne({
    _id: id,
  });
  if (!existOtp) return null;
  const currentDate = new Date();
  const isValidPass = await compare(otp, existOtp?.otp);
  if (
    !isValidPass ||
    existOtp.createdAt.getTime() + 60 * 1000 * 5 < currentDate.getTime() ||
    existOtp.source != type ||
    existOtp.verified
  ) {
    return null;
  }

  return existOtp;
};

//EXPORT
export {
  generateJWT,
  generateForgotPasswordJWT,
  validateToken,
  validateForgotPasswordJWT,
  extractToken,
  generateRandomPassword,
  generateOtp,
  verifyOtp,
  validateRefreshToken,
  jsonAll,
  jsonOne,
  uploadToS3Bucket,
};
