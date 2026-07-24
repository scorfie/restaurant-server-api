import express from 'express';
import * as controller from '../controllers/customer.controller.js';
import { authenticate, requireCustomer, requireStaffRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as customerValidator from '../validators/customer.validator.js';

const router = express.Router();

// Customer self-service (requires a customer login)
router.get('/me', authenticate, requireCustomer, controller.getMe);
router.put('/me', authenticate, requireCustomer, customerValidator.updateProfile, validate, controller.updateMe);
router.put(
  '/me/password',
  authenticate,
  requireCustomer,
  customerValidator.changePassword,
  validate,
  controller.changeMyPassword
);
router.post(
  '/me/orders',
  authenticate,
  requireCustomer,
  customerValidator.createMyOrder,
  validate,
  controller.createMyOrder
);
router.get('/me/orders', authenticate, requireCustomer, customerValidator.listMyOrders, validate, controller.listMyOrders);
router.get(
  '/me/orders/:id',
  authenticate,
  requireCustomer,
  customerValidator.myOrderIdParam,
  validate,
  controller.getMyOrder
);
router.patch(
  '/me/orders/:id/cancel',
  authenticate,
  requireCustomer,
  customerValidator.myOrderIdParam,
  validate,
  controller.cancelMyOrder
);

// Staff visibility into customer accounts
router.get('/', authenticate, requireStaffRole('admin', 'manager'), customerValidator.listCustomers, validate, controller.list);
router.get('/:id', authenticate, requireStaffRole('admin', 'manager'), customerValidator.idParam, validate, controller.getById);

export default router;
