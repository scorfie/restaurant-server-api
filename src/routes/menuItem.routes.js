import express from 'express';
import * as controller from '../controllers/menuItem.controller.js';
import { authenticate, requireStaffRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as menuItemValidator from '../validators/menuItem.validator.js';

// Nested under /branches/:branchId/menu-items
const branchScopedRouter = express.Router({ mergeParams: true });
branchScopedRouter.post(
  '/',
  authenticate,
  requireStaffRole('admin', 'manager'),
  menuItemValidator.createMenuItem,
  validate,
  controller.create
);
branchScopedRouter.get('/', menuItemValidator.listMenuItems, validate, controller.list);

// Flat /menu-items/:id for item-level operations
const flatRouter = express.Router();
flatRouter.get('/:id', menuItemValidator.idParam, validate, controller.getById);
flatRouter.put(
  '/:id',
  authenticate,
  requireStaffRole('admin', 'manager', 'staff'),
  menuItemValidator.updateMenuItem,
  validate,
  controller.update
);
flatRouter.delete(
  '/:id',
  authenticate,
  requireStaffRole('admin', 'manager'),
  menuItemValidator.idParam,
  validate,
  controller.remove
);

export { branchScopedRouter, flatRouter };
