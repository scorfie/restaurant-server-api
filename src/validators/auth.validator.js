import { body } from 'express-validator';

const register = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 150 }),
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('email must be valid'),
  body('password').isString().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage('phone must be a valid phone number'),
  body('address').optional({ nullable: true }).trim().isLength({ max: 255 }),
];

const login = [
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('email must be valid'),
  body('password').notEmpty().withMessage('password is required'),
];

export { register, login };
