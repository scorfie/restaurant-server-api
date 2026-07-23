import { pool } from '../config/db.js';
import ApiError from '../utils/ApiError.js';

function toDbFields(payload) {
  const map = {
    name: 'name',
    code: 'code',
    address: 'address',
    city: 'city',
    state: 'state',
    country: 'country',
    postalCode: 'postal_code',
    phone: 'phone',
    email: 'email',
    managerName: 'manager_name',
    openingTime: 'opening_time',
    closingTime: 'closing_time',
    seatingCapacity: 'seating_capacity',
    latitude: 'latitude',
    longitude: 'longitude',
    status: 'status',
  };

  const fields = {};
  for (const [key, column] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields[column] = payload[key];
    }
  }
  return fields;
}

function toApiShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postal_code,
    phone: row.phone,
    email: row.email,
    managerName: row.manager_name,
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    seatingCapacity: row.seating_capacity,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createBranch(payload) {
  const fields = toDbFields(payload);
  const columns = Object.keys(fields);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(fields);

  const [result] = await pool.query(
    `INSERT INTO branches (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return getBranchById(result.insertId);
}

async function getBranchById(id) {
  const [rows] = await pool.query('SELECT * FROM branches WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Branch with id ${id} not found`);
  }
  return toApiShape(rows[0]);
}

async function listBranches({ page = 1, limit = 20, status, city, search }) {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push('status = ?');
    values.push(status);
  }
  if (city) {
    conditions.push('city = ?');
    values.push(city);
  }
  if (search) {
    conditions.push('(name LIKE ? OR code LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM branches ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM branches ${whereClause}`,
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

async function updateBranch(id, payload) {
  const fields = toDbFields(payload);
  const columns = Object.keys(fields);

  if (columns.length === 0) {
    throw ApiError.badRequest('No valid fields provided to update');
  }

  const setClause = columns.map((col) => `${col} = ?`).join(', ');
  const values = Object.values(fields);

  const [result] = await pool.query(`UPDATE branches SET ${setClause} WHERE id = ?`, [
    ...values,
    id,
  ]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Branch with id ${id} not found`);
  }

  return getBranchById(id);
}

async function updateBranchStatus(id, status) {
  const [result] = await pool.query('UPDATE branches SET status = ? WHERE id = ?', [status, id]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Branch with id ${id} not found`);
  }

  return getBranchById(id);
}

async function deleteBranch(id) {
  const [result] = await pool.query('DELETE FROM branches WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Branch with id ${id} not found`);
  }
}

async function ensureBranchExists(id) {
  const [rows] = await pool.query('SELECT id FROM branches WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Branch with id ${id} not found`);
  }
}

export {
  createBranch,
  getBranchById,
  listBranches,
  updateBranch,
  updateBranchStatus,
  deleteBranch,
  ensureBranchExists,
};
