import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

function toApiShape(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
      },
    });

    return toApiShape(customer);
  }

  async findByEmailWithPassword(email: string) {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  async findById(id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return toApiShape(customer);
  }

  async findAll(query: ListCustomersQueryDto) {
    const { page, limit, search } = query;

    const where: Prisma.CustomerWhereInput = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.customer.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: rows.map(toApiShape),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    await this.findById(id);

    const customer = await this.prisma.customer.update({ where: { id }, data: dto });
    return toApiShape(customer);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    const matches = await bcrypt.compare(dto.currentPassword, customer.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const newHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.prisma.customer.update({ where: { id }, data: { password: newHash } });
  }
}
