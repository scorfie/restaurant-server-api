import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthUser } from '../auth/auth.types';
import { OrdersService } from './orders.service';

interface AckResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger('OrdersGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly ordersService: OrdersService,
  ) {}

  handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const auth = this.jwtService.verify<AuthUser>(token);
      socket.data.auth = auth;

      if (auth.type === 'customer') {
        socket.join(`customer:${auth.sub}`);
      } else if (auth.type === 'staff') {
        socket.join('staff');
      }
    } catch {
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('order:subscribe')
  async onOrderSubscribe(@MessageBody() payload: { orderId?: number } = {}, @ConnectedSocket() socket: Socket): Promise<AckResponse> {
    const auth: AuthUser = socket.data.auth;
    const id = parsePositiveInt(payload?.orderId);
    if (!id) {
      return { success: false, message: 'orderId must be a positive integer' };
    }

    try {
      const order = auth.type === 'customer' ? await this.ordersService.getOrderForCustomer(auth.sub, id) : await this.ordersService.getOrderById(id);
      socket.join(`order:${id}`);
      return { success: true, data: order };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to subscribe to order' };
    }
  }

  @SubscribeMessage('order:unsubscribe')
  onOrderUnsubscribe(@MessageBody() payload: { orderId?: number } = {}, @ConnectedSocket() socket: Socket): void {
    const id = parsePositiveInt(payload?.orderId);
    if (id) socket.leave(`order:${id}`);
  }

  @SubscribeMessage('branch:subscribe')
  onBranchSubscribe(@MessageBody() payload: { branchId?: number } = {}, @ConnectedSocket() socket: Socket): AckResponse {
    const auth: AuthUser = socket.data.auth;
    const id = parsePositiveInt(payload?.branchId);

    if (auth.type !== 'staff') {
      return { success: false, message: 'A staff account is required for this action' };
    }
    if (!id) {
      return { success: false, message: 'branchId must be a positive integer' };
    }

    socket.join(`branch:${id}`);
    return { success: true };
  }

  @SubscribeMessage('branch:unsubscribe')
  onBranchUnsubscribe(@MessageBody() payload: { branchId?: number } = {}, @ConnectedSocket() socket: Socket): void {
    const id = parsePositiveInt(payload?.branchId);
    if (id) socket.leave(`branch:${id}`);
  }

  @OnEvent('order.created')
  handleOrderCreated(order: { id: number; branchId: number; customerId: number | null }) {
    this.broadcast('order:created', order);
  }

  @OnEvent('order.statusChanged')
  handleOrderStatusChanged(order: { id: number; branchId: number; customerId: number | null }) {
    this.broadcast('order:statusChanged', order);
  }

  private broadcast(event: string, order: { id: number; branchId: number; customerId: number | null }) {
    const rooms = [`branch:${order.branchId}`, 'staff', `order:${order.id}`];
    if (order.customerId) {
      rooms.push(`customer:${order.customerId}`);
    }
    this.server.to(rooms).emit(event, order);
  }
}
