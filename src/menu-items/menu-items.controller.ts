import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemsService } from './menu-items.service';

@ApiTags('menu-items')
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Get(':id')
  async findOne(@Param('id', PositiveIntPipe) id: number) {
    const data = await this.menuItemsService.findById(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager', 'staff')
  async update(@Param('id', PositiveIntPipe) id: number, @Body() dto: UpdateMenuItemDto) {
    const data = await this.menuItemsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', PositiveIntPipe) id: number) {
    await this.menuItemsService.remove(id);
  }
}
