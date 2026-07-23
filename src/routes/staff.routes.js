import express from 'express';
import * as controller from '../controllers/staff.controller.js';
import { authenticate, requireStaffRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as staffValidator from '../validators/staff.validator.js';

const router = express.Router();

router.get('/me', authenticate, requireStaffRole('admin', 'manager', 'staff'), controller.getMe);

router.post('/', authenticate, requireStaffRole('admin'), staffValidator.createStaff, validate, controller.create);
router.get('/', authenticate, requireStaffRole('admin', 'manager'), staffValidator.listStaff, validate, controller.list);
router.get('/:id', authenticate, requireStaffRole('admin', 'manager'), staffValidator.idParam, validate, controller.getById);
router.put('/:id', authenticate, requireStaffRole('admin'), staffValidator.updateStaff, validate, controller.update);
router.delete('/:id', authenticate, requireStaffRole('admin'), staffValidator.idParam, validate, controller.remove);

export default router;
