import { RoleType } from '../lib/enums';
import { body, header } from 'express-validator';
import { emailAddress } from './authValidator';
import { createValidation, optionalTextField } from './commonValidator';
import { password } from './userValidator';

const adminDataValidator = () => {
  return [
    createValidation('name', 'Name', true),
    password('password'),
    emailAddress(),
    createValidation('role', 'Role', true)
      .isIn([RoleType.ADMIN, RoleType.SUPER_ADMIN])
      .withMessage('Please select a valid gender')
      .bail(),
  ];
};
const sendPushNotificationValidator = () => {
  return [
    createValidation('fcmTopic', 'fcm Topic', true).isIn([
      'general',
      'politics',
      'sports',
      'entertainment',
      'policies',
      'products',
    ]),
    createValidation('title', 'Title', true),
    createValidation('description', 'Description', true),
  ];
};
const updateAdminValidator = () => {
  return [
    createValidation('name', 'Name', true),
    emailAddress(),
    optionalTextField('password', 'Password', {
      min: 8,
      max: 24,
      nullable: true,
    }),
    optionalTextField('status', 'Status', {
      min: 6,
      max: 8,
      nullable: true,
    }),
    createValidation('role', 'Role', true)
      .isIn([RoleType.ADMIN, RoleType.SUPER_ADMIN])
      .withMessage('Please select a valid gender')
      .bail(),
  ];
};

const adminLoginValidator = () => {
  return [emailAddress(), password('password')];
};

export {
  adminDataValidator,
  adminLoginValidator,
  updateAdminValidator,
  sendPushNotificationValidator,
};
