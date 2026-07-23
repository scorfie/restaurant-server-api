import { body, param, query } from 'express-validator';

const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'];
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

const branchIdParam = [
  param('branchId').isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
];

const idParam = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const createOrder = [
  ...branchIdParam,
  body('customerName').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('customerPhone')
    .optional({ nullable: true })
    .trim()
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage('customerPhone must be a valid phone number'),
  body('orderType')
    .optional()
    .isIn(ORDER_TYPES)
    .withMessage(`orderType must be one of: ${ORDER_TYPES.join(', ')}`),
  body('tableNumber').optional({ nullable: true }).trim().isLength({ max: 10 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.menuItemId').isInt({ min: 1 }).withMessage('items[].menuItemId must be a positive integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('items[].quantity must be a positive integer'),
  body('items.*.notes').optional({ nullable: true }).trim().isLength({ max: 255 }),
];

const listOrders = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(ORDER_STATUSES),
  query('orderType').optional().isIn(ORDER_TYPES),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be an ISO8601 date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be an ISO8601 date'),
];

const listOrdersForBranch = [...branchIdParam, ...listOrders];

const updateOrderStatus = [
  ...idParam,
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(ORDER_STATUSES)
    .withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];

export {
  branchIdParam,
  idParam,
  createOrder,
  listOrders,
  listOrdersForBranch,
  updateOrderStatus,
  ORDER_TYPES,
  ORDER_STATUSES,
};
