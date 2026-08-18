import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, StaffRolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('me')
  @Roles('admin', 'manager', 'staff')
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.staffService.findById(user.sub);
    return { success: true, data };
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateStaffDto) {
    const data = await this.staffService.create(dto);
    return { success: true, data };
  }

  @Get()
  @Roles('admin', 'manager')
  async findAll(@Query() query: ListStaffQueryDto) {
    const result = await this.staffService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles('admin', 'manager')
  async findOne(@Param('id', PositiveIntPipe) id: number) {
    const data = await this.staffService.findById(id);
    return { success: true, data };
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', PositiveIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    const data = await this.staffService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', PositiveIntPipe) id: number) {
    await this.staffService.remove(id);
  }
}
