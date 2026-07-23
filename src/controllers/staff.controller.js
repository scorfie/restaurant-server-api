import * as staffService from '../services/staff.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const getMe = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaffById(req.auth.sub);
  res.status(200).json({ success: true, data: staff });
});

const create = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body);
  res.status(201).json({ success: true, data: staff });
});

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, branchId, role } = req.query;
  const result = await staffService.listStaff({ page: Number(page), limit: Number(limit), branchId, role });
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaffById(req.params.id);
  res.status(200).json({ success: true, data: staff });
});

const update = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(req.params.id, req.body);
  res.status(200).json({ success: true, data: staff });
});

const remove = asyncHandler(async (req, res) => {
  await staffService.deleteStaff(req.params.id);
  res.status(204).send();
});

export { getMe, create, list, getById, update, remove };
