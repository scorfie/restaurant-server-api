import express from 'express';
import * as controller from '../controllers/order.controller.js';
import { authenticate, requireStaffRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as orderValidator from '../validators/order.validator.js';

const manageOrders = [authenticate, requireStaffRole('admin', 'manager', 'staff')];

// Nested under /branches/:branchId/orders (staff take walk-in/dine-in orders here)
const branchScopedRouter = express.Router({ mergeParams: true });
branchScopedRouter.post('/', ...manageOrders, orderValidator.createOrder, validate, controller.create);
branchScopedRouter.get('/', ...manageOrders, orderValidator.listOrdersForBranch, validate, controller.list);

// Flat /orders for cross-branch listing and order-level operations
const flatRouter = express.Router();
flatRouter.get('/', ...manageOrders, orderValidator.listOrders, validate, controller.list);
flatRouter.get('/:id', ...manageOrders, orderValidator.idParam, validate, controller.getById);
flatRouter.patch('/:id/status', ...manageOrders, orderValidator.updateOrderStatus, validate, controller.updateStatus);

export { branchScopedRouter, flatRouter };
