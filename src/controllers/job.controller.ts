import { Request, Response, NextFunction } from 'express';
import { createAcessToken, createRefreshToken, verifyToken } from '../util';
import { OTP, Company, User, Job, JobApplication } from '../models';
import mongoose, { Types, ObjectId, Schema } from 'mongoose';
import { HttpError, isEditAllowedWithRespectToTime, generateRandomString } from '../util';
import { ApplicationStatus, Constants, JobStatus } from '../lib';

import {
  CompanyDocument,
  UserDocument,
  JobInterface,
  CreateJobInterface,
  RequestWithCompany,
  Slot,
  JobDocument,
} from '../interfaces';
import { matchedData } from 'express-validator';
import { jsonOne } from '../util';
import NotificationService from '../lib/notificationService';
import Logging from '../lib/logging';
const notificationService = NotificationService.getInstance();

const createJob = async (req: RequestWithCompany, res: Response, next: NextFunction) => {
  Logging.info('Creating Job!\n' + req.body);
  try {
    const bodyData: CreateJobInterface = matchedData(req, {
      includeOptionals: false,
      locations: ['body'],
    }) as CreateJobInterface;
    const { title, description, uniform, slots, status } = bodyData;

    const parentId = generateRandomString();
    const jobs: JobInterface[] = [];
    slots.forEach((slot) => {
      const newJob: JobInterface = {
        title,
        description,
        uniform,
        startTime: slot.startTime,
        endTime: slot.endTime,
        count: slot.count,
        pricePerHour: slot.pricePerHour,
        applicationsCount: 0,
        selectedCount: 0,
        showedCount: 0,
        companyId: req.company._id,
        parentId,
        status: status ?? JobStatus.DRAFT,
      };
      jobs.push(newJob);
    });
    const data = await Job.insertMany(jobs);
    return jsonOne(res, 200, data);
  } catch (err) {
    next(err);
  }
};

const exportMakeAllDraftsActive = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobs = await Job.updateMany(
      {
        companyId: req.company._id,
        status: 'draft',
      },
      {
        $set: {
          status: 'active',
        },
      },
    );
    return jsonOne(res, 200, jobs);
  } catch (err) {
    next(err);
  }
};

const updateSlot = async (req: RequestWithCompany, res: Response, next: NextFunction) => {
  try {
    const companyId = String(req.company._id);
    const parentId = req.params.parentId as string;
    const jobId = req.params.jobId as string;
    const rejectedApplicationList = req.body.change.rejectedApplicationList as string[];
    const count = req.body.change.count as number;
    const uniform = req.body.change.uniform as string;
    const pricePerHour = req.body.change.pricePerHour as number;

    let slot: JobDocument = await Job.findById(jobId);

    if (
      !slot ||
      String(slot.companyId) != companyId ||
      parentId != String(slot.parentId)
    ) {
      throw new HttpError({
        ...Constants.API_ERRORS.INSUFFICIENT_PERMISSIONS,
      });
    }
    slot.status = slot.status as JobStatus;
    if (![JobStatus.ACTIVE.valueOf(), JobStatus.DRAFT.valueOf()].includes(slot.status)) {
      throw new HttpError({
        ...Constants.API_ERRORS.EDIT_JOB_NOT_ACTIVE_OR_DRAFT,
      });
    }
    if (count) slot = await handleSlotUpdateCount(slot, count, rejectedApplicationList);
    if (uniform) slot = await handleUniformUpdate(slot, uniform);
    if (pricePerHour) slot = await handPricePerHourUpdate(slot, pricePerHour);
    if (slot.count) slot = await slot.save();
    else {
      slot = await slot.delete();
    }
    return jsonOne(res, 200, slot);
  } catch (err) {
    next(err);
  }
};

export default {
  createJob,
  updateSlot,
  exportMakeAllDraftsActive,
};

const handleSlotUpdateCount = async (
  slot: JobDocument,
  count: number,
  rejectedApplicationList: string[],
): Promise<JobDocument> => {
  if (count < slot.count) {
    if (slot.selectedCount) {
      isEditAllowedWithRespectToTime(slot.startTime);
      if (
        slot.selectedCount - count > 0 &&
        (!rejectedApplicationList ||
          !rejectedApplicationList.length ||
          rejectedApplicationList.length < slot.selectedCount - count)
      ) {
        throw new HttpError({
          ...Constants.API_ERRORS.REJECT_LIST_EMPTY_SLOT_REDUCE,
          detail: `${Constants.API_ERRORS.REJECT_LIST_EMPTY_SLOT_REDUCE.detail} ${
            slot.selectedCount - count
          }`,
        });
      }
      // let selectedApplicatons = await JobApplication.find({
      //   _id: { $in: rejectedApplicationList },
      //   jobId: slot._id,
      // });
      // selectedApplicatons = selectedApplicatons.filter(
      //   (app) => app.status === ApplicationStatus.SELECTED,
      // );
      // if (selectedApplicatons.length === rejectedApplicationList.length) {
      //   throw new HttpError({
      //     ...Constants.API_ERRORS.JOB_INACTIVE_OR_COMPLETED,
      //   });
      // }
      await JobApplication.updateMany(
        { _id: { $in: rejectedApplicationList } },
        { $set: { status: ApplicationStatus.REJECTED } },
      );
      const rejectedApplications = await JobApplication.find({
        _id: { $in: rejectedApplicationList },
      });
      const userIds: mongoose.Types.ObjectId[] = rejectedApplications.map(
        (app) => new mongoose.Types.ObjectId(String(app.userId)),
      );
      slot.selectedCount = slot.selectedCount - rejectedApplicationList.length;
      await notificationService.sendInAppNotification(
        userIds,
        `Unfortunately your application was rejected because of unexpected circumstances, Please feel free to apply to other jobs`,
        'job',
        slot._id,
      );
    }
  }
  slot.count = count;
  return slot;
};
const handleUniformUpdate = async (slot: JobDocument, newUniform: string) => {
  if (newUniform != 'Not Required') isEditAllowedWithRespectToTime(slot.startTime);
  if (slot.uniform != newUniform) {
    const applications = await JobApplication.find({
      status: 'selected',
      jobId: slot._id,
    });
    const userIds: mongoose.Types.ObjectId[] = applications.map(
      (app) => new mongoose.Types.ObjectId(String(app.userId)),
    );
    await notificationService.sendInAppNotification(
      userIds,
      `There has been a change in uniform for the job for which you are selected, new uniform is ${slot.uniform}`,
      'job',
      slot._id,
    );
  }
  slot.uniform = newUniform;
  return slot;
};
const handPricePerHourUpdate = async (slot: JobDocument, newPrice: number) => {
  if (slot.pricePerHour > newPrice)
    throw new HttpError({
      ...Constants.API_ERRORS.PRICE_REDUCTION_NOT_ALLOWED,
    });
  if (slot.pricePerHour != newPrice) {
    const applications = await JobApplication.find({
      status: 'selected',
      jobId: slot._id,
    });
    const userIds: mongoose.Types.ObjectId[] = applications.map(
      (app) => new mongoose.Types.ObjectId(String(app.userId)),
    );
    await Promise.all([
      notificationService.sendInAppNotification(
        userIds,
        `Hooray!, hirer has decided to increase price per hour for your job, new price per hour is ${
          newPrice * 0.7
        }`,
        'job',
        slot._id,
      ),
      JobApplication.updateMany({
        pricePerHour: newPrice * 0.7,
        jobId: slot._id,
      }),
    ]);
  }
  slot.pricePerHour = newPrice;

  return slot;
};

//  Hadles job creation in backend
const handleJobCreation = async (
  req: RequestWithCompany,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bodyData: CreateJobInterface = matchedData(req, {
      includeOptionals: false,
      locations: ['body'],
    }) as CreateJobInterface;
  } catch (err) {
    next(err);
  }
};
