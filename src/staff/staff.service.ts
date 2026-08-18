import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Staff } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { BranchesService } from '../branches/branches.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

function toApiShape(staff: Staff) {
  return {
    id: staff.id,
    branchId: staff.branchId,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
}

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
  ) {}

  async create(dto: CreateStaffDto) {
    if (dto.branchId) {
      await this.branchesService.ensureExists(dto.branchId);
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const staff = await this.prisma.staff.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: dto.role ?? 'staff',
        branchId: dto.branchId ?? null,
      },
    });

    return toApiShape(staff);
  }

  async findByEmailWithPassword(email: string) {
    return this.prisma.staff.findUnique({ where: { email } });
  }

  async findById(id: number) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff member with id ${id} not found`);
    }
    return toApiShape(staff);
  }

  async findAll(query: ListStaffQueryDto) {
    const { page, limit, branchId, role } = query;

    const where: Prisma.StaffWhereInput = {
      ...(branchId ? { branchId } : {}),
      ...(role ? { role } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.staff.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      data: rows.map(toApiShape),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: number, dto: UpdateStaffDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    if (dto.branchId) {
      await this.branchesService.ensureExists(dto.branchId);
    }

    await this.findById(id);

    const staff = await this.prisma.staff.update({ where: { id }, data: dto });
    return toApiShape(staff);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.staff.delete({ where: { id } });
  }
}
