import { pool } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { ensureBranchExists } from './branch.service.js';

function toApiShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createStaff({ name, email, password, role = 'staff', branchId = null }) {
  if (branchId) {
    await ensureBranchExists(branchId);
  }

  const passwordHash = await hashPassword(password);

  const [result] = await pool.query(
    `INSERT INTO staff (branch_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
    [branchId, name, email, passwordHash, role]
  );

  return getStaffById(result.insertId);
}

async function findByEmailWithPassword(email) {
  const [rows] = await pool.query('SELECT * FROM staff WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getStaffById(id) {
  const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Staff member with id ${id} not found`);
  }
  return toApiShape(rows[0]);
}

async function listStaff({ page = 1, limit = 20, branchId, role }) {
  const conditions = [];
  const values = [];

  if (branchId) {
    conditions.push('branch_id = ?');
    values.push(branchId);
  }
  if (role) {
    conditions.push('role = ?');
    values.push(role);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM staff ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM staff ${whereClause}`, values);

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

async function updateStaff(id, payload) {
  const map = { name: 'name', role: 'role', branchId: 'branch_id' };
  const fields = {};
  for (const [key, column] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields[column] = payload[key];
    }
  }

  if (fields.branch_id) {
    await ensureBranchExists(fields.branch_id);
  }

  const columns = Object.keys(fields);
  if (columns.length === 0) {
    throw ApiError.badRequest('No valid fields provided to update');
  }

  const setClause = columns.map((col) => `${col} = ?`).join(', ');
  const [result] = await pool.query(`UPDATE staff SET ${setClause} WHERE id = ?`, [
    ...Object.values(fields),
    id,
  ]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Staff member with id ${id} not found`);
  }

  return getStaffById(id);
}

async function deleteStaff(id) {
  const [result] = await pool.query('DELETE FROM staff WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Staff member with id ${id} not found`);
  }
}

export { createStaff, findByEmailWithPassword, getStaffById, listStaff, updateStaff, deleteStaff };
