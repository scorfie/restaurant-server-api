import { pool } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { comparePassword, hashPassword } from '../utils/password.js';

function toApiShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function registerCustomer({ name, email, password, phone = null, address = null }) {
  const passwordHash = await hashPassword(password);

  const [result] = await pool.query(
    `INSERT INTO customers (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)`,
    [name, email, passwordHash, phone, address]
  );

  return getCustomerById(result.insertId);
}

async function findByEmailWithPassword(email) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getCustomerById(id) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Customer with id ${id} not found`);
  }
  return toApiShape(rows[0]);
}

async function listCustomers({ page = 1, limit = 20, search }) {
  const conditions = [];
  const values = [];

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM customers ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM customers ${whereClause}`,
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

async function updateCustomerProfile(id, payload) {
  const map = { name: 'name', phone: 'phone', address: 'address' };
  const fields = {};
  for (const [key, column] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields[column] = payload[key];
    }
  }

  const columns = Object.keys(fields);
  if (columns.length === 0) {
    throw ApiError.badRequest('No valid fields provided to update');
  }

  const setClause = columns.map((col) => `${col} = ?`).join(', ');
  const [result] = await pool.query(`UPDATE customers SET ${setClause} WHERE id = ?`, [
    ...Object.values(fields),
    id,
  ]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Customer with id ${id} not found`);
  }

  return getCustomerById(id);
}

async function changeCustomerPassword(id, currentPassword, newPassword) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Customer with id ${id} not found`);
  }

  const matches = await comparePassword(currentPassword, rows[0].password);
  if (!matches) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await pool.query('UPDATE customers SET password = ? WHERE id = ?', [newHash, id]);
}

export {
  registerCustomer,
  findByEmailWithPassword,
  getCustomerById,
  listCustomers,
  updateCustomerProfile,
  changeCustomerPassword,
};
