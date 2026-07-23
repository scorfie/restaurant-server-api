import express from 'express';
import * as controller from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import * as authValidator from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', authValidator.register, validate, controller.register);
router.post('/login', authValidator.login, validate, controller.customerLogin);
router.post('/staff/login', authValidator.login, validate, controller.staffLogin);

export default router;
