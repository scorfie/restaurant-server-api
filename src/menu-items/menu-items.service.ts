import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MenuItem, Prisma } from '@prisma/client';
import { BranchesService } from '../branches/branches.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ListMenuItemsQueryDto } from './dto/list-menu-items-query.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

function toApiShape(item: MenuItem) {
  return {
    id: item.id,
    branchId: item.branchId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
  ) {}

  async create(branchId: number, dto: CreateMenuItemDto) {
    await this.branchesService.ensureExists(branchId);

    const item = await this.prisma.menuItem.create({
      data: {
        branchId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        category: dto.category ?? null,
        imageUrl: dto.imageUrl ?? null,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    return toApiShape(item);
  }

  async findById(id: number) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Menu item with id ${id} not found`);
    }
    return toApiShape(item);
  }

  async ensureExists(id: number): Promise<void> {
    const item = await this.prisma.menuItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) {
      throw new NotFoundException(`Menu item with id ${id} not found`);
    }
  }

  async findAllForBranch(branchId: number, query: ListMenuItemsQueryDto) {
    await this.branchesService.ensureExists(branchId);

    const { page, limit, category, isAvailable, search } = query;

    const where: Prisma.MenuItemWhereInput = {
      branchId,
      ...(category ? { category } : {}),
      ...(isAvailable !== undefined ? { isAvailable } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.menuItem.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      data: rows.map(toApiShape),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: number, dto: UpdateMenuItemDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    await this.findById(id);

    const item = await this.prisma.menuItem.update({ where: { id }, data: dto });
    return toApiShape(item);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.menuItem.delete({ where: { id } });
  }
}
