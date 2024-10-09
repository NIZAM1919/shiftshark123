import { body, header } from 'express-validator';
import { extractToken } from '../util';
import { createValidation } from './commonValidator';

const authorization = () => {
  return header('authorization')
    .trim()
    .escape()
    .exists()
    .notEmpty()
    .withMessage('Missing authentication header')
    .bail()
    .customSanitizer((token, { location }) => {
      if (location === 'headers') {
        return extractToken(token);
      }
    })
    .isJWT()
    .withMessage('Invalid Authorization header, must be Bearer authorization');
};

const emailAddress = () => {
  return body('email')
    .trim()
    .escape()
    .exists()
    .notEmpty()
    .withMessage('Email address is required')
    .bail()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage('Email address must be between 3 and 100 characters')
    .bail()
    .isEmail()
    .withMessage('Email address is not valid')
    .customSanitizer((email) => {
      return email.toLowerCase();
    });
};
const phoneNumber = () => {
  return body('phone')
    .trim()
    .escape()
    .exists()
    .notEmpty()
    .withMessage('Phone Number is required')
    .bail()
    .isLength({
      min: 10,
      max: 10,
    })
    .withMessage('Please Enter a valid phone number')
    .bail();
};

const genderValidation = createValidation('gender', 'Gender')
  .isIn(['Male', 'Female', 'Other', 'Rather Not Say'])
  .withMessage('Please select a valid gender')
  .bail();
const dateOfBirthValidation = createValidation('dateOfBirth', 'D.O.B.')
  .isISO8601()
  .withMessage('Please enter a valid date of birth')
  .bail();
const interestsValidation = body('interests')
  .exists()
  .withMessage(`Interets are required`)
  .bail()
  .isArray({ min: 1 })
  .withMessage('Please provide at least one interest')
  .bail()
  .custom((value: string[]) => {
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      throw new Error('Each element in interests must be a string');
    }
    return true;
  });

// Validation for latitude
const latitudeValidation = createValidation('lat', 'Address - Latitude')
  .isNumeric()
  .withMessage('Invalid latitude')
  .bail()
  .custom((value, { req }) => {
    const latitude = parseFloat(value);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    return true;
  });

// Validation for longitude
const longitudeValidation = createValidation('long', 'Address - Longitude')
  .isNumeric()
  .withMessage('Invalid longitude')
  .bail()
  .custom((value, { req }) => {
    const longitude = parseFloat(value);
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
    return true;
  });

// Validation array for all fields
const signUpValidations = [
  createValidation('name', 'Name', true),
  createValidation('username', 'Username'),
  genderValidation,
  dateOfBirthValidation,
  createValidation('avatar', 'Avatar', false),
  interestsValidation,
  latitudeValidation,
  longitudeValidation,
  createValidation('formattedAddress', 'Address - formatted addresss'),
  createValidation('city', 'Address - city'),
  createValidation('state', 'Address - state'),
];
const updateValidations = [
  createValidation('name', 'Name', false).optional(),
  createValidation('gender', 'Gender', false)
    .optional()
    .isIn(['Male', 'Female', 'Other', 'Rather Not Say'])
    .withMessage('Please select a valid gender')
    .bail(),
  createValidation('dateOfBirth', 'D.O.B.', false)
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid date of birth')
    .bail(),
  createValidation('avatar', 'Avatar', false).optional(),
  createValidation('fcmToken', 'FCM Token', false).optional(),
  body('interests')
    .optional()
    .bail()
    .isArray({ min: 1 })
    .withMessage('Please provide at least one interest')
    .bail()
    .custom((value: string[]) => {
      if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new Error('Each element in interests must be a string');
      }
      return true;
    }),
  createValidation('lat', 'Address - Latitude', false)
    .optional()
    .isNumeric()
    .withMessage('Invalid latitude')
    .bail()
    .custom((value, { req }) => {
      const latitude = parseFloat(value);
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
      }
      return true;
    }),
  createValidation('long', 'Address - Longitude', false)
    .optional()
    .isNumeric()
    .withMessage('Invalid longitude')
    .bail()
    .custom((value, { req }) => {
      const longitude = parseFloat(value);
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
      }
      return true;
    }),
  createValidation('formattedAddress', 'Address - formatted addresss', false).optional(),
  createValidation('city', 'Address - city', false).optional(),
  createValidation('state', 'Address - state', false).optional(),
  ,
];

const newTokenValidation = () => {
  return createValidation('refreshToken', 'RefreshToken', true)
    .isJWT()
    .withMessage('Invalid refresh token');
};

export {
  authorization,
  emailAddress,
  phoneNumber,
  signUpValidations,
  updateValidations,
  newTokenValidation,
};
