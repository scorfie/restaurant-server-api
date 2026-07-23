import { body, param, query } from 'express-validator';

const STATUS_VALUES = ['active', 'inactive'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
];

const createBranch = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 150 }),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('code is required')
    .isLength({ max: 20 })
    .withMessage('code must be at most 20 characters'),
  body('address').trim().notEmpty().withMessage('address is required').isLength({ max: 255 }),
  body('city').trim().notEmpty().withMessage('city is required').isLength({ max: 100 }),
  body('state').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('country').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('postalCode').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('phone is required')
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage('phone must be a valid phone number'),
  body('email').optional({ nullable: true }).trim().isEmail().withMessage('email must be valid'),
  body('managerName').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('openingTime')
    .optional({ nullable: true })
    .matches(TIME_REGEX)
    .withMessage('openingTime must be in HH:mm or HH:mm:ss format'),
  body('closingTime')
    .optional({ nullable: true })
    .matches(TIME_REGEX)
    .withMessage('closingTime must be in HH:mm or HH:mm:ss format'),
  body('seatingCapacity').optional({ nullable: true }).isInt({ min: 0 }).withMessage('seatingCapacity must be a non-negative integer'),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
  body('status').optional({ nullable: true }).isIn(STATUS_VALUES).withMessage(`status must be one of: ${STATUS_VALUES.join(', ')}`),
];

const updateBranch = [
  ...idParam,
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('code').optional().trim().notEmpty().isLength({ max: 20 }),
  body('address').optional().trim().notEmpty().isLength({ max: 255 }),
  body('city').optional().trim().notEmpty().isLength({ max: 100 }),
  body('state').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('country').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('postalCode').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('phone').optional().trim().matches(/^[0-9+\-\s()]{6,20}$/),
  body('email').optional({ nullable: true }).trim().isEmail(),
  body('managerName').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('openingTime').optional({ nullable: true }).matches(TIME_REGEX),
  body('closingTime').optional({ nullable: true }).matches(TIME_REGEX),
  body('seatingCapacity').optional({ nullable: true }).isInt({ min: 0 }),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
  body('status').optional({ nullable: true }).isIn(STATUS_VALUES),
];

const updateStatus = [
  ...idParam,
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(STATUS_VALUES)
    .withMessage(`status must be one of: ${STATUS_VALUES.join(', ')}`),
];

const listBranches = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(STATUS_VALUES),
  query('city').optional().trim().isLength({ max: 100 }),
  query('search').optional().trim().isLength({ max: 150 }),
];

export { idParam, createBranch, updateBranch, updateStatus, listBranches };
