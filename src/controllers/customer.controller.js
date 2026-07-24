import * as customerService from '../services/customer.service.js';
import * as orderService from '../services/order.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const getMe = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.auth.sub);
  res.status(200).json({ success: true, data: customer });
});

const updateMe = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomerProfile(req.auth.sub, req.body);
  res.status(200).json({ success: true, data: customer });
});

const changeMyPassword = asyncHandler(async (req, res) => {
  await customerService.changeCustomerPassword(req.auth.sub, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

const createMyOrder = asyncHandler(async (req, res) => {
  const { branchId, ...orderPayload } = req.body;
  const order = await orderService.createOrder(branchId, orderPayload, { customerId: req.auth.sub });
  res.status(201).json({ success: true, data: order });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const result = await orderService.listOrders({
    customerId: req.auth.sub,
    page: Number(page),
    limit: Number(limit),
    status,
  });
  res.status(200).json({ success: true, ...result });
});

const getMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForCustomer(req.auth.sub, req.params.id);
  res.status(200).json({ success: true, data: order });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrderForCustomer(req.auth.sub, req.params.id);
  res.status(200).json({ success: true, data: order });
});

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const result = await customerService.listCustomers({ page: Number(page), limit: Number(limit), search });
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.status(200).json({ success: true, data: customer });
});

export {
  getMe,
  updateMe,
  changeMyPassword,
  createMyOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  list,
  getById,
};
