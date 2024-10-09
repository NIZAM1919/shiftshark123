import { HttpError } from '../util';
import { ApplicationStatus, Constants, JobStatus } from '../lib';
import { JobApplicationInterface } from '../interfaces';

const isEditAllowedWithRespectToTime = (startTime: Date) => {
  const threshold = new Date(startTime);
  threshold.setHours(threshold.getHours() - 24);
  if (Date.now() <= threshold.getTime()) return true;
  else
    throw new HttpError({
      ...Constants.API_ERRORS.SLOT_EDIT_NOT_ALLOWED_WRT_TIME,
    });
};
const formatJobsPriceForServiceProvider = (jobs) => {
  return jobs.map((job) => {
    return { ...job, pricePerHour: job.pricePerHour * 0.85 }; // Reduce price by 15% (multiply by 0.85)
  });
};

const startShiftForEmployee = (JobApplication: JobApplicationInterface) => {
  if (JobApplication.status != 'selected')
    throw new HttpError({
      ...Constants.API_ERRORS.BAD_REQUEST,
      detail: `Application is not yet selected, current status is ${JobApplication.status}`,
    });
  const now = Date.now();
  const startTime = JobApplication.requestedStartTime.getTime();
  const oneHoursInMillis = 1 * 60 * 60 * 1000; // 1 hours in milliseconds
  const timeDifference = startTime - now;
  if (timeDifference > oneHoursInMillis || now - startTime >= oneHoursInMillis) {
    throw new HttpError({
      ...Constants.API_ERRORS.START_SHIFT_BEFORE_REQUEST,
    });
  }
};
const endShiftForEmployee = (JobApplication: JobApplicationInterface) => {
  if (JobApplication.status != 'in-progress')
    throw new HttpError({
      ...Constants.API_ERRORS.BAD_REQUEST,
      detail: 'Job is not in progress',
    });
  return true;
};
export {
  isEditAllowedWithRespectToTime,
  startShiftForEmployee,
  endShiftForEmployee,
  formatJobsPriceForServiceProvider,
};
