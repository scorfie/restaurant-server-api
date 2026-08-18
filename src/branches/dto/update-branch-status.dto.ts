import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { BRANCH_STATUSES } from '../../common/constants';

export class UpdateBranchStatusDto {
  @ApiProperty({ enum: BRANCH_STATUSES })
  @IsNotEmpty({ message: 'status is required' })
  @IsIn(BRANCH_STATUSES)
  status: (typeof BRANCH_STATUSES)[number];
}
