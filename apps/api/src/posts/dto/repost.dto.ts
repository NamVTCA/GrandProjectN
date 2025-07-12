import { IsOptional, IsString } from 'class-validator';

export class RepostDto {
  @IsOptional()
  @IsString()
  content?: string;
}