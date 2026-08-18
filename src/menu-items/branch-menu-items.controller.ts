import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ListMenuItemsQueryDto } from './dto/list-menu-items-query.dto';
import { MenuItemsService } from './menu-items.service';

@ApiTags('menu-items')
@Controller('branches/:branchId/menu-items')
export class BranchMenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager')
  async create(@Param('branchId', PositiveIntPipe) branchId: number, @Body() dto: CreateMenuItemDto) {
    const data = await this.menuItemsService.create(branchId, dto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Param('branchId', PositiveIntPipe) branchId: number, @Query() query: ListMenuItemsQueryDto) {
    const result = await this.menuItemsService.findAllForBranch(branchId, query);
    return { success: true, ...result };
  }
}
