import { NextFunction, Request, Response } from 'express';
import { RequestWithUser } from '../interfaces/request.js';
import { Job, JobApplication, User, SavedJob, CompanyInvoice } from '../models';
import supabase from '../boot/supabase';
import Socket from '../util/socket';
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
  formatJobsPriceForServiceProvider,
} from '../util';
import { JobApplicationInterface, UserDocument } from '../interfaces';
import { JobStatus, Constants, ApplicationStatus } from '../lib';
import NotificationService from '../lib/notificationService';
import Logging from '../lib/logging';
import mongoose from 'mongoose';
import { startTimer } from 'winston';
import { errorLogger, logger } from 'express-winston';
const notificationService = NotificationService.getInstance();

const getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  return jsonOne(res, 200, { ...req.user });
};
const updateMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const existingUser = req.user.toObject();
    let user = req.body;
    if (user._id && user._id != req.user._id)
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    user = {
      ...existingUser,
      ...user,
    };

    const userDoc = await User.updateOne(
      { _id: user._id },
      {
        ...user,
      },
    );
    if (!userDoc) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    }
    return jsonOne(res, 200, { ...user });
  } catch (err) {
    next(err);
  }
};
const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestToken = req.headers['x-request-token'];
    if (!requestToken) {
      throw new HttpError({
        ...Constants.API_ERRORS.INSUFFICIENT_PERMISSIONS,
        detail: 'Invalid Request Token',
      });
    }
    const requestTokenData: any = verifyToken(requestToken as string);
    if (
      !requestTokenData ||
      !requestTokenData.phone ||
      requestTokenData?.type != 'short-lived' ||
      requestTokenData.source != 'service-provider'
    ) {
      throw new HttpError({
        ...Constants.API_ERRORS.INSUFFICIENT_PERMISSIONS,
      });
    }
    const { phone } = requestTokenData;

    let { user, additionalDetails, bankDetails, idDetails } = req.body;
    const query = {
      phone,
    };
    if (user.email) {
      query['email'] = user.email;
    }
    const existingUserDoc = await User.findOne({ ...query });
    if (existingUserDoc) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_ALREADY_EXISTS,
      });
    }
    let onboardingCompleted = false;
    if (
      bankDetails &&
      idDetails.PAN &&
      idDetails.aadharNumber &&
      additionalDetails.photoURL &&
      additionalDetails.skills &&
      additionalDetails.resume &&
      additionalDetails.schoolName &&
      additionalDetails.aboutMe
    ) {
      onboardingCompleted = true;
    }
    const userDoc: UserDocument = new User({
      cityName: 'Bangalore',
      ...user,
      dob: new Date(user.dob),
      phone,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
      onboardingCompleted,
      additionalDetails,
      idDetails,
      bankDetails,
      role: 'service-provider',
    });
    await userDoc.save();
    const accessToken = createAcessToken({
      userId: String(userDoc._id),
      role: 'service-provider',
    });
    const refreshToken = createRefreshToken({
      userId: String(userDoc._id),
      role: 'service-provider',
    });
    const data = {
      accessToken,
      refreshToken,
      user: userDoc,
    };
    return jsonOne(res, 200, data);
  } catch (e) {
    next(e);
  }
};
const addBankDetails = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  Logging.info('Saving Bank Details...');
  try {
    const existingUser = req.user;
    let bankDetails = req.body;
    const { additionalDetails, idDetails } = existingUser;
    let onboardingCompleted = false;
    if (
      additionalDetails &&
      idDetails?.PAN &&
      idDetails?.aadharNumber &&
      additionalDetails?.photoURL &&
      additionalDetails?.skills &&
      additionalDetails?.resume &&
      additionalDetails?.schoolName &&
      additionalDetails?.aboutMe
    ) {
      onboardingCompleted = true;
    }
    if (bankDetails?.confirmAccountNumber) {
      delete bankDetails.confirmAccountNumber;
    }
    const updateData = {
      bankDetails,
      onboardingCompleted,
      updatedAt: new Date(),
    };
    const userDoc = await User.updateOne(
      { _id: existingUser._id },
      { $set: updateData }, // Use $set to avoid the mergeClone error
    );
    if (!userDoc) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    }
    const data = {
      user: {
        ...existingUser,
        bankDetails,
        onboardingCompleted,
        updatedAt: new Date(),
      },
    };
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};
const addAdditionalDetails = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  Logging.info('Saving Additional Details...');
  try {
    const existingUser = req.user;
    const additionalDetails = req.body;
    const idDetails = req.body;
    // Ensure the IDs are not being re-uploaded
    if (
      (existingUser?.idDetails?.PAN && additionalDetails.PAN) ||
      (existingUser?.idDetails?.aadharNumber && additionalDetails.aadharNumber)
    ) {
      throw new HttpError({
        ...Constants.API_ERRORS.BAD_REQUEST,
        detail: 'You cannot re-upload your IDs, please contact support',
      });
    }
    let onboardingCompleted = false;
    if (
      additionalDetails &&
      existingUser.bankDetails?.accountHolderName &&
      idDetails.PAN &&
      idDetails.aadharNumber &&
      additionalDetails.photoURL &&
      additionalDetails.skills &&
      additionalDetails.resume &&
      additionalDetails.schoolName &&
      additionalDetails.aboutMe
    ) {
      onboardingCompleted = true;
    }
    const updateData = {
      additionalDetails: {
        ...existingUser.additionalDetails,
        ...additionalDetails,
      },
      idDetails: {
        ...existingUser.idDetails,
        ...idDetails,
      },
      onboardingCompleted,
      verified:
        additionalDetails?.PAN || additionalDetails?.aadharNumber
          ? false
          : existingUser.verified,
      updatedAt: new Date(),
    };
    const userDoc = await User.updateOne({ _id: existingUser._id }, { $set: updateData });
    if (!userDoc) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    }
    const data = {
      user: {
        ...existingUser.toObject(),
        ...updateData,
        _id: req.user._id,
      },
    };
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};
const getJobs = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const pageOptions = getPageOptions(req);
    let query: any = {
      status: JobStatus.ACTIVE,
    };
    let jobs = await Job.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .lean();
    jobs = formatJobsPriceForServiceProvider(jobs);
    return jsonOne(res, 200, jobs);
  } catch (err) {
    next(err);
  }
};
const applyForJob = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        jobId: req.params.jobId,
        userId: req.user._id,
      }),
    ]);
    if (job.status != JobStatus.ACTIVE) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (existingApplication) {
      throw new HttpError({
        ...Constants.API_ERRORS.BAD_REQUEST,
        detail: 'You have already applied to this job',
      });
    }
    const startTime = job.startTime.getTime();
    const threshold = new Date(job.startTime.getTime());
    threshold.setHours(threshold.getHours() - 24);

    if (Date.now() > threshold.getTime()) {
      throw new HttpError({
        ...Constants.API_ERRORS.BAD_REQUEST,
        detail: `You can only apply to job at least 24 hours before the start time'`,
      });
    }
    const application: JobApplicationInterface = new JobApplication({
      companyId: job.companyId,
      jobId: job._id,
      userId: req.user._id,
      requestedStartTime: job.startTime,
      requestedEndTime: job.endTime,
      parentId: job.parentId,
      status: ApplicationStatus.APPLIED,
      pricePerHour: job.pricePerHour * 0.7, // reduce price
    });
    const objectIdArray = [new mongoose.Types.ObjectId(String(job.companyId))];
    const data = await Promise.all([
      JobApplication.create(application),
      Job.updateOne({ _id: application.jobId }, { $inc: { applicationsCount: 1 } }),
      notificationService.sendInAppNotification(
        [req.user._id],
        `Your Job Application was submitted successfully for ${job.title}`,
        'job',
        job._id,
      ),
      notificationService.sendInAppNotification(
        objectIdArray,
        `A new application has been submitted by ${req.user.name} for you job posting - ${job.title}`,
        'job',
        job._id,
      ),
    ]);
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};
const withdrawApplication = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { withdrawReason } = req.body;
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        jobId: req.params.jobId,
        userId: req.user._id,
      }),
    ]);
    if (job.status != JobStatus.ACTIVE) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (!existingApplication) {
      throw new HttpError({
        ...Constants.API_ERRORS.APPLICATION_MISSING,
      });
    }
    isEditAllowedWithRespectToTime(existingApplication.requestedStartTime);
    const promises: any = [
      JobApplication.updateOne(
        { _id: existingApplication._id },
        {
          $set: {
            status: ApplicationStatus.WITHDRAWN,
            'meta.withdrawReason': withdrawReason,
          },
        },
      ),
    ];
    //TODO : check if we should reduce the application count as well or not?
    if (existingApplication.status === ApplicationStatus.SELECTED) {
      const objectIdArray = [new mongoose.Types.ObjectId(String(job.companyId))];
      promises.push(
        Job.updateOne(
          { _id: existingApplication.jobId },
          { $inc: { selectedCount: -1 } },
        ),
        notificationService.sendInAppNotification(
          objectIdArray,
          `An existing selected application was withdrawn by the candidate for ${job.title}`,
          'job',
          job._id,
        ),
      );
    }
    const data = await Promise.all(promises);
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};

const getMyAppliedJobs = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pageOptions = getPageOptions(req);
    let query: any = {
      userId: req.user._id,
      status: req.query?.status || ApplicationStatus.APPLIED,
    };
    const applications = await JobApplication.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .populate('jobId')
      .lean();
    for (const app of applications) {
      app[String(app.jobId)]['pricePerHour'] = app['pricePerHour'];
    }
    return jsonOne(res, 200, applications);
  } catch (err) {
    next(err);
  }
};
const getConversationsWithLastMessage = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pageOptions = getPageOptions(req);
    const limit = pageOptions.limit;
    const skip = pageOptions.skipCount;

    const { data: conversations, error: convError } = await supabase
      .from('conversation')
      .select('*')
      .eq('applicant_id', req.user._id)
      .range(skip, skip + limit - 1);

    if (convError) {
      throw new HttpError({
        ...Constants.API_ERRORS.INTERNAL_ERROR,
        meta: convError,
      });
    }
    const conversationIds = conversations.map((conversation) => conversation.id);

    const messagePromises = [];
    conversationIds.forEach((conversationId) => {
      const promise = supabase
        .from('message')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data: messages, error: msgError }) => {
          if (msgError) {
            throw new HttpError({
              ...Constants.API_ERRORS.INTERNAL_ERROR,
              meta: msgError,
            });
          }
          return messages.length > 0 ? messages[0] : null;
        });

      messagePromises.push(promise);
    });

    const latestMessages = await Promise.all(messagePromises);
    const conversationsWithLastMessage = conversations.map((con) => {
      const lastMessage = latestMessages.find((msg) => msg.conversation_id === con.id);
      return { ...con, lastMessage };
    });
    return jsonOne(res, 200, conversationsWithLastMessage);
  } catch (err) {
    Logging.log(err);
    next(err);
  }
};

const getOrCreateConversation = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const applicationId = req.params.applicationId;
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        _id: applicationId,
        userId: req.user._id,
      }),
    ]);
    if (job.status != JobStatus.ACTIVE) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (!existingApplication) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    const now = Date.now();
    const startTime = existingApplication.requestedStartTime.getTime();
    const twentyFourHoursInMillis = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeDifference = startTime - now;
    if (timeDifference > twentyFourHoursInMillis || Date.now() - startTime > 0) {
      throw new HttpError({
        ...Constants.API_ERRORS.CONVERSATION_START_RANGE_ERROR,
      });
    }

    const { data: conversations, error: convError } = await supabase
      .from('conversation')
      .select('*')
      .eq('application_id', applicationId);
    if (convError) {
      throw new HttpError({
        ...Constants.API_ERRORS.INTERNAL_ERROR,
        meta: convError,
      });
    }

    if (conversations && conversations?.length) {
      return jsonOne(res, 200, conversations[0]);
    }

    const conversation = await supabase
      .from('conversation')
      .insert({
        name: `${job.title} - ${req.user.name}`,
        application_id: applicationId,
        applicant_id: req.user._id,
        company_admin_id: job.companyId,
        created_at: new Date(),
        id: applicationId,
      })
      .select();
    return jsonOne(res, 200, conversation);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const applicationId = req.params.applicationId;
    const conversationId = req.params.conversationId;
    const message = req.body.message;
    const { data: conversations, error: convError } = await supabase
      .from('conversation')
      .select('*')
      .eq('id', applicationId);

    if (convError) {
      throw new HttpError({
        ...Constants.API_ERRORS.INTERNAL_ERROR,
        meta: convError,
      });
    }

    if (!conversations || !conversations?.length) {
      throw new HttpError({
        ...Constants.API_ERRORS.INTERNAL_ERROR,
        meta: convError,
      });
    }

    const messageSent = await supabase
      .from('message')
      .upsert({
        user_id: String(req.user._id),
        message: message,
        conversation_id: conversationId,
      })
      .select();
    Socket.notifyUsersOnConversationCreate(
      [String(conversations[0].companyAdminId)] as string[],
      message,
    );

    return jsonOne(res, 200, messageSent);
  } catch (err) {
    next(err);
  }
};
const getConversationMessages = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const conversationId = req.params.conversationId;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const { data: conversations, error: convError } = await supabase
      .from('conversation')
      .select('*')
      .eq('id', conversationId);

    if (convError) {
      throw new HttpError({
        ...Constants.API_ERRORS.INTERNAL_ERROR,
        meta: convError,
      });
    }

    if (!conversations || !conversations?.length) {
      throw new HttpError({
        ...Constants.API_ERRORS.INTERNAL_ERROR,
        meta: convError,
      });
    }

    const messages = await supabase
      .from('message')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return jsonOne(res, 200, messages);
  } catch (err) {
    next(err);
  }
};

const saveJob = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      SavedJob.findOne({
        jobId: req.params.jobId,
        userId: req.user._id,
      }),
    ]);
    if (job.status != JobStatus.ACTIVE || !job) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (existingApplication) {
      return jsonOne(res, 200, existingApplication);
    }
    const data = new SavedJob({
      userId: req.user._id,
      jobId: job._id,
      parentId: job.parentId,
      companyId: job.companyId,
    });
    await data.save();
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};
const unSaveJob = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const data = await SavedJob.deleteMany({
      jobId: req.params.jobId,
      userId: req.user._id,
    });
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};
const listSavedJobs = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const pageOptions = getPageOptions(req);
    let query: any = {
      userId: req.user._id,
    };
    let jobs = await SavedJob.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .populate('jobId')
      .lean();
    jobs = formatJobsPriceForServiceProvider(jobs);
    return jsonOne(res, 200, jobs);
  } catch (err) {
    next(err);
  }
};
const listAppliedJobs = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pageOptions = getPageOptions(req);
    let query: any = {
      userId: req.user._id,
    };
    let jobs = await JobApplication.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .populate('jobId')
      .lean();
    jobs = formatJobsPriceForServiceProvider(jobs);
    return jsonOne(res, 200, jobs);
  } catch (err) {
    next(err);
  }
};

const getApplicationForJob = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pageOptions = getPageOptions(req);
    let query: any = {
      userId: req.user._id,
      jobId: req.params.jobId,
    };
    let jobs = await JobApplication.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .populate('jobId')
      .lean();
    jobs = formatJobsPriceForServiceProvider(jobs);
    return jsonOne(res, 200, jobs);
  } catch (err) {
    next(err);
  }
};

const startShift = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        _id: req.params.applicationId,
      }),
    ]);
    if (job.status != JobStatus.ACTIVE) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (!existingApplication) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (existingApplication.otp)
      return jsonOne(res, 200, { otp: existingApplication.otp });
    startShiftForEmployee(existingApplication);
    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    await JobApplication.updateOne(
      { _id: req.params.applicationId },
      {
        $set: {
          otp: otp,
        },
      },
    );
    return jsonOne(res, 200, { otp });
  } catch (err) {
    next(err);
  }
};
const endShift = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const endTime = new Date();
    const otp = req.body.otp;
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        _id: req.params.applicationId,
      }),
    ]);
    if (!otp || job.status != JobStatus.ACTIVE) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (!existingApplication) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    endShiftForEmployee(existingApplication);
    if (existingApplication.otp !== otp)
      throw new HttpError({
        ...Constants.API_ERRORS.BAD_REQUEST,
        detail: 'invalid OTP',
      });
    // company amount
    const amount =
      ((endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60)) *
      job.pricePerHour;
    const companyInvoice = new CompanyInvoice({
      companyId: job.companyId,
      parentId: job.parentId,
      jobId: job._id,
      userId: req.user._id,
      pricePerHour: job.pricePerHour,
      startTime: existingApplication.startTime,
      endTime,
      total: amount + 20,
      processingFees: 20,
      amountBilled: amount,
    });
    await Promise.all([
      JobApplication.updateOne(
        { _id: req.params.applicationId },
        {
          $set: {
            status: 'completed',
            otp: null,
            endTime: endTime,
            amountBilled: amount * 0.7,
          },
        },
      ),
      Job.updateOne(
        { _id: req.params.jobId },
        {
          $set: {
            status: 'completed',
          },
        },
      ),
      companyInvoice.save(),
    ]);

    return jsonOne(res, 200, { ...existingApplication, amountBilled: amount * 0.85 });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Retrieve all users from the User collection
    // where : "role": "service-provider"
    const query = { role: 'service-provider' };
    const pageOptions = getPageOptions(req);
    const users = await User.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .lean();
    // const users = await User.find().lean();

    // If no users are found, return an empty array
    if (!users || users.length === 0) {
      return jsonOne(res, 200, []);
    }

    // Return the users in the response
    return jsonOne(res, 200, users);
  } catch (err) {
    next(err);
  }
};

const getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Retrieve user details from the User collection
    const user = await User.findById(userId).lean();

    // If the user is not found, return a 404 response
    if (!user) {
      return jsonOne(res, 404, { message: 'User not found' });
    }

    // Return the user details in the response
    return jsonOne(res, 200, user);
  } catch (err) {
    next(err);
  }
};

export default {
  getMe,
  getAllUsers,
  getUserDetails,
  updateMe,
  signUp,
  addBankDetails,
  addAdditionalDetails,
  getJobs,
  applyForJob,
  withdrawApplication,
  getConversationsWithLastMessage,
  getOrCreateConversation,
  sendMessage,
  getMyAppliedJobs,
  saveJob,
  unSaveJob,
  listSavedJobs,
  startShift,
  getConversationMessages,
  endShift,
  listAppliedJobs,
  getApplicationForJob,
};
