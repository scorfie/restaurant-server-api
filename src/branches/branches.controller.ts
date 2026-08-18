import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffRolesGuard } from '../common/guards/staff-roles.guard';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchStatusDto } from './dto/update-branch-status.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager')
  async create(@Body() dto: CreateBranchDto) {
    const data = await this.branchesService.create(dto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: ListBranchesQueryDto) {
    const result = await this.branchesService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id', PositiveIntPipe) id: number) {
    const data = await this.branchesService.findById(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager')
  async update(@Param('id', PositiveIntPipe) id: number, @Body() dto: UpdateBranchDto) {
    const data = await this.branchesService.update(id, dto);
    return { success: true, data };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager')
  async updateStatus(@Param('id', PositiveIntPipe) id: number, @Body() dto: UpdateBranchStatusDto) {
    const data = await this.branchesService.updateStatus(id, dto.status);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffRolesGuard)
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', PositiveIntPipe) id: number) {
    await this.branchesService.remove(id);
  }
}
