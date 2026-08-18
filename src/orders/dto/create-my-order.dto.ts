import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class CreateMyOrderDto extends CreateOrderDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  branchId: number;
}
