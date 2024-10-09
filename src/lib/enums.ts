//ROLE ENUMS
export enum RoleType {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super admin',
}
//USER ACCOUNT STATUS ENUMS
export enum AccountStatus {
  Active = 'activate',
  DEACTIVE = 'deactivate',
}
//OTP SEND TYPE ENUMS
export enum OtpType {
  FORGET = 'forget',
  VERIFICATION = 'verification',
}

//POLL STATUS TYPE ENUMS

export enum ApplicationStatus {
  APPLIED = 'pending',
  SHORTLISTED = 'shortlisted',
  SELECTED = 'selected',
  NO_SHOW = 'no_show',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  ISSUE_HAPPENED = 'issue_happened',
  WITHDRAWN = 'withdrawn',
}

export enum UserStatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum JobStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  STARTED = 'started',
  COMPLTETED = 'completed',
  DELETED = 'deleted',
}
