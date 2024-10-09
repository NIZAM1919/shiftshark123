import { body, header } from 'express-validator';
import { extractToken } from '../util';
import { createValidation } from './commonValidator';
import { requiredTextField } from './commonValidator';
import mongoose from 'mongoose';

const optionsValidator = body('options')
  .exists()
  .withMessage('Options are required')
  .bail()
  .isArray({ min: 2 })
  .withMessage('Please provide at least 2 options')
  .bail()
  .custom((value: any[]) => {
    if (!Array.isArray(value)) {
      throw new Error('Options must be an array');
    }

    const isValid = value.every((item) => {
      return (
        typeof item === 'object' &&
        item !== null &&
        Object.keys(item).length === 1 &&
        typeof item.value === 'string'
      );
    });

    if (!isValid) {
      throw new Error(
        'Each element in options must be an object with a "value" key of type string',
      );
    }

    return true;
  });

const createPollValidations = [
  createValidation('title', 'Title'),
  optionsValidator,
  createValidation('category', 'Category'),
  createValidation('expiresAt', 'Poll Expiry')
    .isISO8601()
    .withMessage('Please enter a valid date')
    .bail(),
];

const updatePollValidation = () => {
  return body('status')
    .exists()
    .bail()
    .notEmpty()
    .withMessage('Status is required')
    .bail()
    .trim()
    .isIn(['approved', 'rejected', 'removed'])
    .withMessage('Please select a valid status.')
    .bail();
};

const optionValidator = () => {
  return body('optionId')
    .exists()
    .withMessage('Option is required')
    .bail()
    .custom((value: any) => {
      if (!mongoose.Types.ObjectId.isValid(new mongoose.Types.ObjectId(value))) {
        throw new Error('OptionId must be a valid ObjectId');
      }
      return true;
    });
};

export { optionsValidator, createPollValidations, updatePollValidation, optionValidator };
