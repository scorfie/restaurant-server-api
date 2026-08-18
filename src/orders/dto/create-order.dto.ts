import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Min, MaxLength, ValidateNested } from 'class-validator';
import { ORDER_TYPES, PHONE_REGEX } from '../../common/constants';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  menuItemId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'customerPhone must be a valid phone number' })
  customerPhone?: string;

  @ApiPropertyOptional({ enum: ORDER_TYPES, default: 'dine_in' })
  @IsOptional()
  @IsIn(ORDER_TYPES)
  orderType?: (typeof ORDER_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  tableNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'items must be a non-empty array' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
