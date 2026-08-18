import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'currentPassword is required' })
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'newPassword must be at least 8 characters' })
  newPassword: string;
}
