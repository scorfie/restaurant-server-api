import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerGuard } from '../common/guards/customer.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { CreateMyOrderDto } from '../orders/dto/create-my-order.dto';
import { ListMyOrdersQueryDto } from '../orders/dto/list-orders-query.dto';
import { OrdersService } from '../orders/orders.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('me')
  @UseGuards(CustomerGuard)
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.customersService.findById(user.sub);
    return { success: true, data };
  }

  @Put('me')
  @UseGuards(CustomerGuard)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const data = await this.customersService.updateProfile(user.sub, dto);
    return { success: true, data };
  }

  @Put('me/password')
  @UseGuards(CustomerGuard)
  async changeMyPassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.customersService.changePassword(user.sub, dto);
    return { success: true, message: 'Password updated successfully' };
  }

  @Post('me/orders')
  @UseGuards(CustomerGuard)
  async createMyOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateMyOrderDto) {
    const { branchId, ...orderPayload } = dto;
    const data = await this.ordersService.createOrder(branchId, orderPayload, user.sub);
    return { success: true, data };
  }

  @Get('me/orders')
  @UseGuards(CustomerGuard)
  async listMyOrders(@CurrentUser() user: AuthUser, @Query() query: ListMyOrdersQueryDto) {
    const result = await this.ordersService.listOrders({ customerId: user.sub, query });
    return { success: true, ...result };
  }

  @Get('me/orders/:id')
  @UseGuards(CustomerGuard)
  async getMyOrder(@CurrentUser() user: AuthUser, @Param('id', PositiveIntPipe) id: number) {
    const data = await this.ordersService.getOrderForCustomer(user.sub, id);
    return { success: true, data };
  }

  @Patch('me/orders/:id/cancel')
  @UseGuards(CustomerGuard)
  async cancelMyOrder(@CurrentUser() user: AuthUser, @Param('id', PositiveIntPipe) id: number) {
    const data = await this.ordersService.cancelOrderForCustomer(user.sub, id);
    return { success: true, data };
  }

  @Get()
  @UseGuards(StaffRolesGuard)
  @Roles('admin', 'manager')
  async findAll(@Query() query: ListCustomersQueryDto) {
    const result = await this.customersService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  @UseGuards(StaffRolesGuard)
  @Roles('admin', 'manager')
  async findOne(@Param('id', PositiveIntPipe) id: number) {
    const data = await this.customersService.findById(id);
    return { success: true, data };
  }
}
