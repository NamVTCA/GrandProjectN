// apps/api/src/users/dto/update-user.dto.ts
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @IsOptional()
  @IsString()
  username?: string;
}
