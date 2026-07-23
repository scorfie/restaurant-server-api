import { body, param, query } from 'express-validator';
import { ORDER_STATUSES, ORDER_TYPES } from './order.validator.js';

const idParam = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const updateProfile = [
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage('phone must be a valid phone number'),
  body('address').optional({ nullable: true }).trim().isLength({ max: 255 }),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('currentPassword is required'),
  body('newPassword').isString().isLength({ min: 8 }).withMessage('newPassword must be at least 8 characters'),
];

const createMyOrder = [
  body('branchId').isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
  body('orderType').optional().isIn(ORDER_TYPES).withMessage(`orderType must be one of: ${ORDER_TYPES.join(', ')}`),
  body('tableNumber').optional({ nullable: true }).trim().isLength({ max: 10 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.menuItemId').isInt({ min: 1 }).withMessage('items[].menuItemId must be a positive integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('items[].quantity must be a positive integer'),
  body('items.*.notes').optional({ nullable: true }).trim().isLength({ max: 255 }),
];

const myOrderIdParam = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const listMyOrders = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(ORDER_STATUSES),
];

const listCustomers = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ max: 150 }),
];

export { idParam, updateProfile, changePassword, createMyOrder, myOrderIdParam, listMyOrders, listCustomers };
