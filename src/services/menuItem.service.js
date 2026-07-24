import { pool } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { ensureBranchExists } from './branch.service.js';

function toApiShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    isAvailable: !!row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createMenuItem(branchId, payload) {
  await ensureBranchExists(branchId);

  const {
    name,
    description = null,
    price,
    category = null,
    imageUrl = null,
    isAvailable = true,
  } = payload;

  const [result] = await pool.query(
    `INSERT INTO menu_items (branch_id, name, description, price, category, image_url, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [branchId, name, description, price, category, imageUrl, isAvailable ? 1 : 0]
  );

  return getMenuItemById(result.insertId);
}

async function getMenuItemById(id) {
  const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Menu item with id ${id} not found`);
  }
  return toApiShape(rows[0]);
}

async function ensureMenuItemExists(id) {
  const [rows] = await pool.query('SELECT id FROM menu_items WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Menu item with id ${id} not found`);
  }
}

async function listMenuItemsForBranch(branchId, { page = 1, limit = 20, category, isAvailable, search }) {
  await ensureBranchExists(branchId);

  const conditions = ['branch_id = ?'];
  const values = [branchId];

  if (category) {
    conditions.push('category = ?');
    values.push(category);
  }
  if (isAvailable !== undefined) {
    conditions.push('is_available = ?');
    values.push(isAvailable ? 1 : 0);
  }
  if (search) {
    conditions.push('name LIKE ?');
    values.push(`%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM menu_items ${whereClause} ORDER BY category, name LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM menu_items ${whereClause}`,
    values
  );

  return {
    data: rows.map(toApiShape),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    },
  };
}

async function updateMenuItem(id, payload) {
  const map = {
    name: 'name',
    description: 'description',
    price: 'price',
    category: 'category',
    imageUrl: 'image_url',
    isAvailable: 'is_available',
  };

  const fields = {};
  for (const [key, column] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields[column] = key === 'isAvailable' ? (payload[key] ? 1 : 0) : payload[key];
    }
  }

  const columns = Object.keys(fields);
  if (columns.length === 0) {
    throw ApiError.badRequest('No valid fields provided to update');
  }

  const setClause = columns.map((col) => `${col} = ?`).join(', ');
  const values = Object.values(fields);

  const [result] = await pool.query(`UPDATE menu_items SET ${setClause} WHERE id = ?`, [
    ...values,
    id,
  ]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Menu item with id ${id} not found`);
  }

  return getMenuItemById(id);
}

async function deleteMenuItem(id) {
  const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Menu item with id ${id} not found`);
  }
}

export {
  createMenuItem,
  getMenuItemById,
  ensureMenuItemExists,
  listMenuItemsForBranch,
  updateMenuItem,
  deleteMenuItem,
};
