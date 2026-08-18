import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';
import { BranchesService } from '../branches/branches.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListMyOrdersQueryDto, ListOrdersQueryDto } from './dto/list-orders-query.dto';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

type MenuItemLockRow = { id: number; name: string; price: Prisma.Decimal; is_available: boolean };

function orderToApiShape(order: Order) {
  return {
    id: order.id,
    branchId: order.branchId,
    customerId: order.customerId,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    status: order.status,
    notes: order.notes,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function orderItemToApiShape(item: OrderItem) {
  return {
    id: item.id,
    menuItemId: item.menuItemId,
    itemName: item.itemName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
    notes: item.notes,
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(branchId: number, dto: CreateOrderDto, customerId: number | null = null) {
    await this.branchesService.ensureExists(branchId);

    let resolvedCustomerName = dto.customerName ?? null;
    let resolvedCustomerPhone = dto.customerPhone ?? null;

    if (customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: customerId }, select: { name: true, phone: true } });
      if (!customer) {
        throw new NotFoundException(`Customer with id ${customerId} not found`);
      }
      resolvedCustomerName = customer.name;
      resolvedCustomerPhone = customer.phone;
    }

    const menuItemIds = [...new Set(dto.items.map((i) => i.menuItemId))];

    const orderId = await this.prisma.$transaction(async (tx) => {
      const menuItemRows = await tx.$queryRaw<MenuItemLockRow[]>(
        Prisma.sql`SELECT id, name, price, is_available FROM menu_items WHERE id IN (${Prisma.join(menuItemIds)}) AND branch_id = ${branchId} FOR UPDATE`,
      );

      const menuItemsById = new Map(menuItemRows.map((row) => [row.id, row]));

      for (const menuItemId of menuItemIds) {
        const menuItem = menuItemsById.get(menuItemId);
        if (!menuItem) {
          throw new BadRequestException(`Menu item ${menuItemId} does not belong to branch ${branchId}`);
        }
        if (!menuItem.is_available) {
          throw new BadRequestException(`Menu item "${menuItem.name}" (id ${menuItemId}) is not available`);
        }
      }

      const resolvedItems = dto.items.map((item) => {
        const menuItem = menuItemsById.get(item.menuItemId)!;
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

      const order = await tx.order.create({
        data: {
          branchId,
          customerId,
          customerName: resolvedCustomerName,
          customerPhone: resolvedCustomerPhone,
          orderType: dto.orderType ?? 'dine_in',
          tableNumber: dto.tableNumber ?? null,
          notes: dto.notes ?? null,
          totalAmount,
        },
      });

      const orderNumber = `ORD-${String(order.id).padStart(6, '0')}`;
      await tx.order.update({ where: { id: order.id }, data: { orderNumber } });

      await tx.orderItem.createMany({
        data: resolvedItems.map((i) => ({
          orderId: order.id,
          menuItemId: i.menuItemId,
          itemName: i.itemName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          subtotal: i.subtotal,
          notes: i.notes,
        })),
      });

      return order.id;
    });

    const order = await this.getOrderById(orderId);
    this.eventEmitter.emit('order.created', order);
    return order;
  }

  async getOrderById(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return this.withItems(order);
  }

  async getOrderForCustomer(customerId: number, id: number) {
    const order = await this.prisma.order.findFirst({ where: { id, customerId } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return this.withItems(order);
  }

  async listOrders(params: {
    branchId?: number;
    customerId?: number;
    query: ListOrdersQueryDto | ListMyOrdersQueryDto;
  }) {
    const { branchId, customerId, query } = params;
    const { page, limit, status } = query;
    const orderType = 'orderType' in query ? query.orderType : undefined;
    const dateFrom = 'dateFrom' in query ? query.dateFrom : undefined;
    const dateTo = 'dateTo' in query ? query.dateTo : undefined;

    const where: Prisma.OrderWhereInput = {
      ...(branchId ? { branchId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(orderType ? { orderType } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: rows.map(orderToApiShape),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async cancelOrderForCustomer(customerId: number, id: number) {
    const order = await this.prisma.order.findUnique({ where: { id }, select: { customerId: true } });
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return this.updateOrderStatus(id, 'cancelled');
  }

  async updateOrderStatus(id: number, nextStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const currentStatus = order.status;
    const allowedNext = STATUS_TRANSITIONS[currentStatus] ?? [];

    if (currentStatus === nextStatus) {
      throw new BadRequestException(`Order is already in status "${currentStatus}"`);
    }
    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition order from "${currentStatus}" to "${nextStatus}". Allowed: ${allowedNext.length ? allowedNext.join(', ') : 'none (terminal status)'}`,
      );
    }

    await this.prisma.order.update({ where: { id }, data: { status: nextStatus } });

    const updated = await this.getOrderById(id);
    this.eventEmitter.emit('order.statusChanged', updated);
    return updated;
  }

  private async withItems(order: Order) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } });
    return { ...orderToApiShape(order), items: items.map(orderItemToApiShape) };
  }
}
