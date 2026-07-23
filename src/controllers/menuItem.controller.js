import * as menuItemService from '../services/menuItem.service.js';
import asyncHandler from '../utils/asyncHandler.js';

const create = asyncHandler(async (req, res) => {
  const item = await menuItemService.createMenuItem(req.params.branchId, req.body);
  res.status(201).json({ success: true, data: item });
});

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, isAvailable, search } = req.query;
  const result = await menuItemService.listMenuItemsForBranch(req.params.branchId, {
    page: Number(page),
    limit: Number(limit),
    category,
    isAvailable: isAvailable === undefined ? undefined : isAvailable === 'true',
    search,
  });
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const item = await menuItemService.getMenuItemById(req.params.id);
  res.status(200).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await menuItemService.updateMenuItem(req.params.id, req.body);
  res.status(200).json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  await menuItemService.deleteMenuItem(req.params.id);
  res.status(204).send();
});

export { create, list, getById, update, remove };
