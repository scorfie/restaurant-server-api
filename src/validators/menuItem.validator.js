import { body, param, query } from 'express-validator';

const branchIdParam = [
  param('branchId').isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
];

const idParam = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const createMenuItem = [
  ...branchIdParam,
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 150 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  body('category').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
];

const updateMenuItem = [
  ...idParam,
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  body('category').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
];

const listMenuItems = [
  ...branchIdParam,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().trim().isLength({ max: 100 }),
  query('isAvailable').optional().isBoolean(),
  query('search').optional().trim().isLength({ max: 150 }),
];

export { branchIdParam, idParam, createMenuItem, updateMenuItem, listMenuItems };
