import * as orderService from '../services/order.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.params.branchId, req.body);
  res.status(201).json({ success: true, data: order });
});

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, orderType, dateFrom, dateTo } = req.query;
  const result = await orderService.listOrders({
    branchId: req.params.branchId,
    page: Number(page),
    limit: Number(limit),
    status,
    orderType,
    dateFrom,
    dateTo,
  });
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).json({ success: true, data: order });
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: order });
});

export { create, list, getById, updateStatus };
