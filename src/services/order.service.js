import { pool } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { ensureBranchExists } from './branch.service.js';

const STATUS_TRANSITIONS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function orderToApiShape(row) {
  if (!row) return null;
  return {
    id: row.id,
    branchId: row.branch_id,
    customerId: row.customer_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderType: row.order_type,
    tableNumber: row.table_number,
    status: row.status,
    notes: row.notes,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderItemToApiShape(row) {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    itemName: row.item_name,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    subtotal: Number(row.subtotal),
    notes: row.notes,
  };
}

async function createOrder(branchId, payload, { customerId = null } = {}) {
  await ensureBranchExists(branchId);

  const {
    customerName = null,
    customerPhone = null,
    orderType = 'dine_in',
    tableNumber = null,
    notes = null,
    items,
  } = payload;

  let resolvedCustomerName = customerName;
  let resolvedCustomerPhone = customerPhone;

  if (customerId) {
    const [customerRows] = await pool.query('SELECT name, phone FROM customers WHERE id = ?', [customerId]);
    if (customerRows.length === 0) {
      throw ApiError.notFound(`Customer with id ${customerId} not found`);
    }
    resolvedCustomerName = customerRows[0].name;
    resolvedCustomerPhone = customerRows[0].phone;
  }

  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];

  const connection = await pool.getConnection();
  let orderId;
  try {
    await connection.beginTransaction();

    const [menuItemRows] = await connection.query(
      `SELECT id, name, price, is_available FROM menu_items WHERE id IN (?) AND branch_id = ? FOR UPDATE`,
      [menuItemIds, branchId]
    );

    const menuItemsById = new Map(menuItemRows.map((row) => [row.id, row]));

    for (const menuItemId of menuItemIds) {
      const menuItem = menuItemsById.get(menuItemId);
      if (!menuItem) {
        throw ApiError.badRequest(`Menu item ${menuItemId} does not belong to branch ${branchId}`);
      }
      if (!menuItem.is_available) {
        throw ApiError.badRequest(`Menu item "${menuItem.name}" (id ${menuItemId}) is not available`);
      }
    }

    const resolvedItems = items.map((item) => {
      const menuItem = menuItemsById.get(item.menuItemId);
      const unitPrice = Number(menuItem.price);
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      return {
        menuItemId: item.menuItemId,
        itemName: menuItem.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
        notes: item.notes || null,
      };
    });

    const totalAmount = Number(resolvedItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));

    const [orderResult] = await connection.query(
      `INSERT INTO orders (branch_id, customer_id, customer_name, customer_phone, order_type, table_number, notes, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [branchId, customerId, resolvedCustomerName, resolvedCustomerPhone, orderType, tableNumber, notes, totalAmount]
    );

    orderId = orderResult.insertId;
    const orderNumber = `ORD-${String(orderId).padStart(6, '0')}`;

    await connection.query('UPDATE orders SET order_number = ? WHERE id = ?', [orderNumber, orderId]);

    const itemValues = resolvedItems.map((i) => [
      orderId,
      i.menuItemId,
      i.itemName,
      i.unitPrice,
      i.quantity,
      i.subtotal,
      i.notes,
    ]);

    await connection.query(
      `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, notes)
       VALUES ?`,
      [itemValues]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return getOrderById(orderId);
}

async function getOrderById(id) {
  const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (orderRows.length === 0) {
    throw ApiError.notFound(`Order with id ${id} not found`);
  }

  const [itemRows] = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
    [id]
  );

  return {
    ...orderToApiShape(orderRows[0]),
    items: itemRows.map(orderItemToApiShape),
  };
}

async function getOrderForCustomer(customerId, id) {
  const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ? AND customer_id = ?', [
    id,
    customerId,
  ]);
  if (orderRows.length === 0) {
    throw ApiError.notFound(`Order with id ${id} not found`);
  }

  const [itemRows] = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
    [id]
  );

  return {
    ...orderToApiShape(orderRows[0]),
    items: itemRows.map(orderItemToApiShape),
  };
}

async function listOrders({ branchId, customerId, page = 1, limit = 20, status, orderType, dateFrom, dateTo }) {
  const conditions = [];
  const values = [];

  if (branchId) {
    conditions.push('branch_id = ?');
    values.push(branchId);
  }
  if (customerId) {
    conditions.push('customer_id = ?');
    values.push(customerId);
  }
  if (status) {
    conditions.push('status = ?');
    values.push(status);
  }
  if (orderType) {
    conditions.push('order_type = ?');
    values.push(orderType);
  }
  if (dateFrom) {
    conditions.push('created_at >= ?');
    values.push(new Date(dateFrom));
  }
  if (dateTo) {
    conditions.push('created_at <= ?');
    values.push(new Date(dateTo));
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM orders ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders ${whereClause}`,
    values
  );

  return {
    data: rows.map(orderToApiShape),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    },
  };
}

async function updateOrderStatus(id, nextStatus) {
  const [rows] = await pool.query('SELECT status FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Order with id ${id} not found`);
  }

  const currentStatus = rows[0].status;
  const allowedNext = STATUS_TRANSITIONS[currentStatus] || [];

  if (currentStatus === nextStatus) {
    throw ApiError.badRequest(`Order is already in status "${currentStatus}"`);
  }
  if (!allowedNext.includes(nextStatus)) {
    throw ApiError.badRequest(
      `Cannot transition order from "${currentStatus}" to "${nextStatus}". Allowed: ${
        allowedNext.length ? allowedNext.join(', ') : 'none (terminal status)'
      }`
    );
  }

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, id]);

  return getOrderById(id);
}

export { createOrder, getOrderById, getOrderForCustomer, listOrders, updateOrderStatus };
