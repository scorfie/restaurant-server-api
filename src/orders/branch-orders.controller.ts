import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('branches/:branchId/orders')
@UseGuards(JwtAuthGuard, StaffRolesGuard)
@Roles('admin', 'manager', 'staff')
export class BranchOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Param('branchId', PositiveIntPipe) branchId: number, @Body() dto: CreateOrderDto) {
    const data = await this.ordersService.createOrder(branchId, dto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Param('branchId', PositiveIntPipe) branchId: number, @Query() query: ListOrdersQueryDto) {
    const result = await this.ordersService.listOrders({ branchId, query });
    return { success: true, ...result };
  }
}
