import * as branchService from '../services/branch.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const create = asyncHandler(async (req, res) => {
  const branch = await branchService.createBranch(req.body);
  res.status(201).json({ success: true, data: branch });
});

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, city, search } = req.query;
  const result = await branchService.listBranches({ page: Number(page), limit: Number(limit), status, city, search });
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.id);
  res.status(200).json({ success: true, data: branch });
});

const update = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  res.status(200).json({ success: true, data: branch });
});

const updateStatus = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranchStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: branch });
});

const remove = asyncHandler(async (req, res) => {
  await branchService.deleteBranch(req.params.id);
  res.status(204).send();
});

export { create, list, getById, update, updateStatus, remove };
