import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from '../customers/customers.service';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly customersService: CustomersService,
    private readonly staffService: StaffService,
  ) {}

  async customerLogin(email: string, password: string) {
    const customer = await this.customersService.findByEmailWithPassword(email);
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ sub: customer.id, type: 'customer' });
    return { token, customer: await this.customersService.findById(customer.id) };
  }

  async staffLogin(email: string, password: string) {
    const staff = await this.staffService.findByEmailWithPassword(email);
    if (!staff || !(await bcrypt.compare(password, staff.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ sub: staff.id, type: 'staff', role: staff.role });
    return { token, staff: await this.staffService.findById(staff.id) };
  }
}
