import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { ORDER_STATUSES } from '../../common/constants';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsNotEmpty({ message: 'status is required' })
  @IsIn(ORDER_STATUSES)
  status: (typeof ORDER_STATUSES)[number];
}
