import { Request, Response, NextFunction } from 'express';
import { JobApplicationDocument, RequestWithCompany } from '../interfaces';
import { RequestWithUser } from '../interfaces/request.js';
import supabase from '../boot/supabase';
import Socket from '../util/socket';
import {
  HttpError,
  createAcessToken,
  createRefreshToken,
  getPageOptions,
  verifyToken,
  isEditAllowedWithRespectToTime,
  startShiftForEmployee,
  endShiftForEmployee,
  sendOTP,
  sendProfileVerificationEmail,
} from '../util';
import { Company, User, Job, JobApplication } from '../models';
import { CompanyDocument, UserDocument, UserModel } from '../interfaces';
import { JobStatus, Constants, ApplicationStatus } from '../lib';
import { jsonOne } from '../util';
import NotificationService from '../lib/notificationService';
import mongoose from 'mongoose';
import Logging from '../lib/logging';
const notificationService = NotificationService.getInstance();

const signUp = async (req: Request, res: Response, next: NextFunction) => {
  Logging.info('Saving Comapany Details...');
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
      !requestTokenData.email ||
      requestTokenData?.type != 'short-lived' ||
      requestTokenData.source != 'hirer'
    ) {
      throw new HttpError({
        ...Constants.API_ERRORS.INSUFFICIENT_PERMISSIONS,
      });
    }
    const { email } = requestTokenData;

    let { user, companyDetails } = req.body;
    const query = {
      email,
    };
    if (user.phone) {
      query['phone'] = user.phone;
    }
    const existingUserDoc = await User.findOne({ ...query });
    if (existingUserDoc) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_ALREADY_EXISTS,
      });
    }
    const companyDoc: CompanyDocument = new Company({
      cityName: 'Bangalore',
      ...companyDetails,
      kycStatus: 'pending',
      isNgo: companyDetails.registrationNumber ? true : false,
    });
    await companyDoc.save();

    const userDoc: UserDocument = new User({
      cityName: 'Bangalore',
      ...user,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
      onboardingCompleted: true,
      role: 'hirer',
      companyId: companyDoc._id,
    });
    await userDoc.save();
    const accessToken = createAcessToken({
      userId: String(userDoc._id),
      role: 'hirer',
    });
    const refreshToken = createRefreshToken({
      userId: String(userDoc._id),
      role: 'hirer',
    });
    return jsonOne(res, 200, {
      accessToken,
      refreshToken,
      user: {
        ...user,
        _id: userDoc._id,
      },
    });
  } catch (err) {
    next(err);
  }
};
const updateProfile = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const existingUser = req.user;

    let { user } = req.body;
    if (user._id && user._id != req.user._id)
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });

    // Convert existingUser to a plain object
    const existingUserObj = existingUser.toObject();

    user = {
      ...existingUserObj,
      ...user,
      onboardingCompleted: true,
    };
    const userDoc = await User.updateOne(
      { _id: req.user._id },
      {
        $set: user,
      },
    );

    if (!userDoc.matchedCount) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    }
    return jsonOne(res, 200, {
      user: {
        ...user,
        _id: req.user._id,
      },
    });
  } catch (err) {
    next(err);
  }
};
const getMe = async (req: RequestWithCompany, res: Response, next: NextFunction) => {
  try {
    return jsonOne(res, 200, {
      user: req.user,
      company: req.company,
    });
  } catch (err) {
    next(err);
  }
};
const getJobs = async (req: RequestWithCompany, res: Response, next: NextFunction) => {
  try {
    const pageOptions = getPageOptions(req);
    const type = req.query.type;
    let query: any = {
      companyId: req.company._id,
    };
    switch (type) {
      case 'on-going':
        query = {
          ...query,
          status: JobStatus.STARTED,
        };
        break;
      case 'past':
        query = {
          ...query,
          status: JobStatus.COMPLTETED,
        };
      case 'future':
        query = {
          ...query,
          status: { $in: [JobStatus.ACTIVE, JobStatus.DRAFT] },
        };
        break;
    }
    const jobs: any = await Job.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .lean();
    return jsonOne(res, 200, jobs);
  } catch (err) {
    next(err);
  }
};
const getSlotDetails = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { companyId, jobId } = req.params;
    // Ensure that jobId and companyId exist
    if (!jobId || !companyId) {
      Logging.info('Either the jobId or the companyId does not exist');
    }
    const job = await Job.findById(req.params.jobId).lean();
    if (!job || String(job.companyId) != String(companyId))
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_MISSING,
      });

    return jsonOne(res, 200, job);
  } catch (err) {
    next(err);
  }
};
const getSlotApplicants = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const job = await Job.findById(req.params.jobId).lean();
    if (!job || String(job.companyId) != String(req.company._id))
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_MISSING,
      });
    const pageOptions = getPageOptions(req);
    const {
      gender,
      ratings,
      status,
    }: { gender: string; ratings: string; status: string } = req.query as {
      gender: string;
      ratings: string;
      status: string;
    };

    let userQuery = {};
    if (gender) {
      userQuery = {
        ...userQuery,
        gender: {
          $in: [gender.split(',')],
        },
      };
    }
    if (ratings) {
      userQuery = {
        ...userQuery,
        ratings: {
          $gte: Number(ratings),
        },
      };
    }

    let query: any = {
      companyId: req.company._id,
      jobId: req.params.jobId,
    };
    if (status) {
      query = {
        ...query,
        status: {
          $in: [status.split(',')],
        },
      };
    }
    const JobApplications = await JobApplication.find(query)
      .populate({
        path: 'userId',
        select: 'name email additionalDetails avatar gender',
        match: userQuery,
        options: { alias: 'applicant' },
      })
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .lean();

    return jsonOne(res, 200, JobApplications);
  } catch (err) {
    next(err);
  }
};
const getApplicantDetails = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    let query: any = {
      companyId: req.company._id,
      jobId: req.params.jobId,
      _id: req.params.applicantId,
    };

    const details = await JobApplication.findOne(query).populate({
      path: 'userId',
      options: { alias: 'applicant' },
    });
    if (!details)
      throw new HttpError({
        ...Constants.API_ERRORS.INSUFFICIENT_PERMISSIONS,
      });

    return jsonOne(res, 200, details);
  } catch (err) {
    next(err);
  }
};

const updateApplicationStatus = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const application = await updateApplicationStatusUtil(
      req.body.status,
      req.params.applicantId,
      req.company._id,
    );
    console.log(application.status);
    // const userId = new mongoose.Types.ObjectId(String(application.userId));

    // await notificationService.sendInAppNotification(
    //   [userId],
    //   `Your Job Application status for was changed to ${req.body.status}`,
    //   'application',
    //   application._id,
    // );
    await application.save();

    return jsonOne(res, 200, application);
  } catch (err) {
    next(err);
  }
};
const bulkUpdateApplicationStatus = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.body.status;
    const applicationIds = req.body.applicationIds;
    const applications = [];
    for (const applicationId of applicationIds) {
      const application = await updateApplicationStatusUtil(
        status,
        applicationId,
        req.company._id,
      );
      applications.push(application.save());
    }
    const response = await Promise.all(applications);

    return jsonOne(res, 200, response);
  } catch (err) {
    next(err);
  }
};

const getConversationsWithLastMessage = async (
  req: RequestWithCompany,
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
      .eq('company_admin_id', req.company._id)
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
    next(err);
  }
};

const getOrCreateConversation = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const applicationId = req.params.applicationId;
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        _id: applicationId,
        companyId: req.company._id,
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
        applicant_id: existingApplication.userId,
        company_admin_id: job.companyId,
        created_at: new Date(),
        id: applicationId,
      })
      .select();
    console.log(conversation);
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
      [String(conversations[0].applicantId)] as string[],
      message,
    );
    return jsonOne(res, 200, messageSent);
  } catch (err) {
    next(err);
  }
};

const startShift = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const otp = req.body.otp;
    const [job, existingApplication] = await Promise.all([
      Job.findById(req.params.jobId),
      JobApplication.findOne({
        _id: req.params.applicationId,
      }).lean(),
    ]);
    if (!job || job.status != JobStatus.ACTIVE) {
      throw new HttpError({
        ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      });
    }
    if (!existingApplication) {
      throw new HttpError({
        ...Constants.API_ERRORS.APPLICATION_MISSING,
      });
    }
    startShiftForEmployee(existingApplication);
    if (existingApplication.otp !== otp)
      throw new HttpError({
        ...Constants.API_ERRORS.BAD_REQUEST,
        detail: 'Invalid OTP',
      });
    await JobApplication.updateOne(
      { _id: req.params.applicationId },
      {
        $set: {
          status: 'in-progress',
          otp: null,
          startTime: new Date(),
        },
      },
    );
    return jsonOne(res, 200, { ...existingApplication });
  } catch (err) {
    next(err);
  }
};

const endSift = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const rating = +req.body.rating;
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
        ...Constants.API_ERRORS.APPLICATION_MISSING,
      });
    }
    endShiftForEmployee(existingApplication);
    const objectIdArray = [
      new mongoose.Types.ObjectId(String(existingApplication.userId)),
    ];
    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Promise.all([
      JobApplication.updateOne(
        { _id: req.params.applicationId },
        {
          $set: {
            otp: otp,
            rating,
          },
        },
      ),
      User.updateOne(
        {
          _id: existingApplication.userId,
        },
        {
          $inc: {
            rating: 5,
            jobsCompleted: 1,
          },
        },
      ),
      notificationService.sendInAppNotification(
        objectIdArray,
        `Hirer has requested to end your shift for ${job.title}. Please get the otp from hirer and use it here`,
        'application',
        existingApplication._id,
      ),
    ]);

    return jsonOne(res, 200, { otp });
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

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Retrieve all users from the User collection
    // where : "role": "hirer"
    const query = { role: 'hirer' };
    const pageOptions = getPageOptions(req);
    const users = await User.find(query)
      .sort(pageOptions.sortOptions)
      .skip(pageOptions.skipCount)
      .limit(pageOptions.limit)
      .lean();

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

const updateUserVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const { user } = req.body;

    // Check if userId from URI matches the one in the request body if present
    if (user.userId && user.userId !== userId) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    }

    // Fetch the existing user from the database
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      throw new HttpError({
        ...Constants.API_ERRORS.USER_MISSING,
      });
    }

    // Update the verification status
    existingUser.verified = user.verified;

    // Save the updated user document
    await existingUser.save();

    const response = await sendProfileVerificationEmail({
      email: user.email,
      name: user.name,
      phone: user.phone,
      userID: user.userId,
    });
    Logging.info(`Profile Verification Email has been Sent to the Hirer: ${user.email}\n`);

    // Return the updated user details
    return jsonOne(res, 200, {
      user: existingUser.toObject(),
    });
  } catch (err) {
    next(err);
  }
};

export default {
  signUp,
  getAllUsers,
  getUserDetails,
  updateProfile,
  updateUserVerificationStatus,
  getMe,
  getJobs,
  getSlotDetails,
  getSlotApplicants,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicantDetails,
  getOrCreateConversation,
  getConversationsWithLastMessage,
  sendMessage,
  startShift,
  endSift,
  getConversationMessages,
};

const handleApplicationSelectedFlow = async (application: JobApplicationDocument) => {
  if (application.status === ApplicationStatus.SELECTED)
    throw new HttpError({
      ...Constants.API_ERRORS.BAD_REQUEST,
      detail: 'Candidate is already selected',
    });
  const threshold = new Date(application.requestedStartTime.getTime());
  threshold.setHours(threshold.getHours() - 24);
  if (threshold.getTime() <= Date.now()) {
    throw new HttpError({
      ...Constants.API_ERRORS.BAD_REQUEST,
      detail: 'You can accept applications only at least 24 hours before the start time',
    });
  }
  application['status'] = ApplicationStatus.SELECTED;
  await notificationService.sendInAppNotification(
    [new mongoose.Types.ObjectId(String(application.userId))],
    `Hooray, you have been selected for a job`,
    'application',
    application._id,
  );
  await Job.updateOne({ _id: application.jobId }, { $inc: { selectedCount: 1 } });
  return application;
};
const handleApplicationRejectedFlow = async (application: JobApplicationDocument) => {
  if (application.status === ApplicationStatus.SELECTED) {
    isEditAllowedWithRespectToTime(application.requestedStartTime);
    await notificationService.sendInAppNotification(
      [new mongoose.Types.ObjectId(String(application.userId))],
      `Oh No due to unexpected circumstances your application was moved from selected to rejected`,
      'application',
      application._id,
    );
    await Job.updateOne({ _id: application.jobId }, { $inc: { selectedCount: -1 } });
  } else {
    await notificationService.sendInAppNotification(
      [new mongoose.Types.ObjectId(String(application.userId))],
      `Oh No unfortunately your application was not selected but do not lose hope you can always apply for new jobs`,
      'application',
      application._id,
    );
  }

  application['status'] = ApplicationStatus.REJECTED;
  return application;
};
const handleApplicationShortlistedFlow = async (application: JobApplicationDocument) => {
  application['status'] = ApplicationStatus.SHORTLISTED;
  return application;
};
const updateApplicationStatusUtil = async (
  status: string,
  applicationId: string,
  companyId: string,
) => {
  let application: JobApplicationDocument = await JobApplication.findById(applicationId);
  if (!application || String(application.companyId) != String(companyId))
    throw new HttpError({
      ...Constants.API_ERRORS.APPLICATION_MISSING,
    });
  switch (status) {
    case 'selected': {
      application = await handleApplicationSelectedFlow(application);
      break;
    }
    case 'rejected': {
      application = await handleApplicationRejectedFlow(application);
      break;
    }
    case 'shortlisted': {
      application = await handleApplicationShortlistedFlow(application);
      break;
    }
  }
  return application;
};
