import * as authService from '../services/auth.service.js';
import * as customerService from '../services/customer.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const register = asyncHandler(async (req, res) => {
  const customer = await customerService.registerCustomer(req.body);
  res.status(201).json({ success: true, data: customer });
});

const customerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.customerLogin(email, password);
  res.status(200).json({ success: true, data: result });
});

const staffLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.staffLogin(email, password);
  res.status(200).json({ success: true, data: result });
});

export { register, customerLogin, staffLogin };
