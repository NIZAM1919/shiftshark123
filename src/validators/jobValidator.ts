import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

const createJobValidations = [
  body('title').notEmpty().withMessage('Title is required').isString(),
  body('description').notEmpty().withMessage('Description is required').isString(),
  body('uniform').optional().isString(),
  body('status').optional().isString(),
  body('slots').isArray({ min: 1 }).withMessage('At least one slot is required'),
  body('slots.*.startTime').isISO8601().toDate(),
  body('slots.*.endTime').isISO8601().toDate(),
  body('slots.*.count').isInt({ min: 1 }).withMessage('Count must be a positive integer'),
  body('slots.*.pricePerHour').isNumeric().withMessage('Price per hour must be a number'),
];
export { createJobValidations };
