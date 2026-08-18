import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Branch, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

function toApiShape(branch: Branch) {
  return {
    id: branch.id,
    name: branch.name,
    code: branch.code,
    address: branch.address,
    city: branch.city,
    state: branch.state,
    country: branch.country,
    postalCode: branch.postalCode,
    phone: branch.phone,
    email: branch.email,
    managerName: branch.managerName,
    openingTime: branch.openingTime,
    closingTime: branch.closingTime,
    seatingCapacity: branch.seatingCapacity,
    latitude: branch.latitude !== null ? Number(branch.latitude) : null,
    longitude: branch.longitude !== null ? Number(branch.longitude) : null,
    status: branch.status,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

function toTimeDate(value?: string): Date | undefined {
  if (value === undefined) return undefined;
  return new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}Z`);
}

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const branch = await this.prisma.branch.create({
      data: {
        ...dto,
        openingTime: toTimeDate(dto.openingTime),
        closingTime: toTimeDate(dto.closingTime),
      },
    });
    return toApiShape(branch);
  }

  async findById(id: number) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
    return toApiShape(branch);
  }

  async findAll(query: ListBranchesQueryDto) {
    const { page, limit, status, city, search } = query;

    const where: Prisma.BranchWhereInput = {
      ...(status ? { status } : {}),
      ...(city ? { city } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.branch.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: rows.map(toApiShape),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: number, dto: UpdateBranchDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    await this.ensureExists(id);

    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        ...dto,
        openingTime: toTimeDate(dto.openingTime),
        closingTime: toTimeDate(dto.closingTime),
      },
    });
    return toApiShape(branch);
  }

  async updateStatus(id: number, status: 'active' | 'inactive') {
    await this.ensureExists(id);
    const branch = await this.prisma.branch.update({ where: { id }, data: { status } });
    return toApiShape(branch);
  }

  async remove(id: number): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.branch.delete({ where: { id } });
  }

  async ensureExists(id: number): Promise<void> {
    const branch = await this.prisma.branch.findUnique({ where: { id }, select: { id: true } });
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
  }
}
