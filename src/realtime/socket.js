import { Server } from 'socket.io';

import * as orderService from '../services/order.service.js';
import { verifyToken } from '../utils/jwt.js';
import orderEvents from './orderEvents.js';

function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function fetchOrderForSocket(auth, orderId) {
  if (auth.type === 'customer') {
    return orderService.getOrderForCustomer(auth.sub, orderId);
  }
  return orderService.getOrderById(orderId);
}

function broadcastOrder(io, event, order) {
  const rooms = [`branch:${order.branchId}`, 'staff', `order:${order.id}`];
  if (order.customerId) {
    rooms.push(`customer:${order.customerId}`);
  }
  // A single chained emit dedupes delivery for sockets that belong to more than one targeted room.
  io.to(rooms).emit(event, order);
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token is required'));
    }
    try {
      socket.data.auth = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { auth } = socket.data;

    if (auth.type === 'customer') {
      socket.join(`customer:${auth.sub}`);
    } else if (auth.type === 'staff') {
      socket.join('staff');
    }

    socket.on('order:subscribe', async ({ orderId } = {}, ack) => {
      const id = parsePositiveInt(orderId);
      if (!id) {
        return typeof ack === 'function' && ack({ success: false, message: 'orderId must be a positive integer' });
      }

      try {
        const order = await fetchOrderForSocket(auth, id);
        socket.join(`order:${id}`);
        if (typeof ack === 'function') ack({ success: true, data: order });
      } catch (err) {
        if (typeof ack === 'function') ack({ success: false, message: err.message });
      }
    });

    socket.on('order:unsubscribe', ({ orderId } = {}) => {
      const id = parsePositiveInt(orderId);
      if (id) socket.leave(`order:${id}`);
    });

    socket.on('branch:subscribe', ({ branchId } = {}, ack) => {
      const id = parsePositiveInt(branchId);
      if (auth.type !== 'staff') {
        return typeof ack === 'function' && ack({ success: false, message: 'A staff account is required for this action' });
      }
      if (!id) {
        return typeof ack === 'function' && ack({ success: false, message: 'branchId must be a positive integer' });
      }
      socket.join(`branch:${id}`);
      if (typeof ack === 'function') ack({ success: true });
    });

    socket.on('branch:unsubscribe', ({ branchId } = {}) => {
      const id = parsePositiveInt(branchId);
      if (id) socket.leave(`branch:${id}`);
    });
  });

  orderEvents.on('order:created', (order) => broadcastOrder(io, 'order:created', order));
  orderEvents.on('order:statusChanged', (order) => broadcastOrder(io, 'order:statusChanged', order));

  return io;
}

export { initSocket };
