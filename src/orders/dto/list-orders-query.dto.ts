import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ORDER_STATUSES, ORDER_TYPES } from '../../common/constants';

export class ListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({ enum: ORDER_TYPES })
  @IsOptional()
  @IsIn(ORDER_TYPES)
  orderType?: (typeof ORDER_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: 'dateFrom must be an ISO8601 date' })
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: 'dateTo must be an ISO8601 date' })
  dateTo?: string;
}

export class ListMyOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];
}
