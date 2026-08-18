import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomersService } from '../customers/customers.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customersService: CustomersService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.customersService.register(dto);
    return { success: true, data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async customerLogin(@Body() dto: LoginDto) {
    const data = await this.authService.customerLogin(dto.email, dto.password);
    return { success: true, data };
  }

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  async staffLogin(@Body() dto: LoginDto) {
    const data = await this.authService.staffLogin(dto.email, dto.password);
    return { success: true, data };
  }
}
