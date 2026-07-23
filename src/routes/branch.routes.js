import express from 'express';
import * as controller from '../controllers/branch.controller.js';
import { authenticate, requireStaffRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as branchValidator from '../validators/branch.validator.js';

const router = express.Router();

const manageBranch = [authenticate, requireStaffRole('admin', 'manager')];

router.post('/', ...manageBranch, branchValidator.createBranch, validate, controller.create);
router.get('/', branchValidator.listBranches, validate, controller.list);
router.get('/:id', branchValidator.idParam, validate, controller.getById);
router.put('/:id', ...manageBranch, branchValidator.updateBranch, validate, controller.update);
router.patch('/:id/status', ...manageBranch, branchValidator.updateStatus, validate, controller.updateStatus);
router.delete('/:id', ...manageBranch, branchValidator.idParam, validate, controller.remove);

export default router;
