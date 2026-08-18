import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, StaffRolesGuard)
@Roles('admin', 'manager', 'staff')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query() query: ListOrdersQueryDto) {
    const result = await this.ordersService.listOrders({ query });
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id', PositiveIntPipe) id: number) {
    const data = await this.ordersService.getOrderById(id);
    return { success: true, data };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', PositiveIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    const data = await this.ordersService.updateOrderStatus(id, dto.status);
    return { success: true, data };
  }
}
