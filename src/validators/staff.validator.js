import { body, param, query } from 'express-validator';

const ROLES = ['admin', 'manager', 'staff'];

const idParam = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const createStaff = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 150 }),
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('email must be valid'),
  body('password').isString().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('role').optional().isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
  body('branchId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
];

const updateStaff = [
  ...idParam,
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('role').optional().isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
  body('branchId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
];

const listStaff = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('branchId').optional().isInt({ min: 1 }),
  query('role').optional().isIn(ROLES),
];

export { idParam, createStaff, updateStaff, listStaff, ROLES };
