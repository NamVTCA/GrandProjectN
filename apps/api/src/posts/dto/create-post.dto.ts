import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreatePostDto {
  @ValidateIf((o) => !o.mediaUrls || o.mediaUrls.length === 0)
  @IsNotEmpty({ message: 'Nội dung không được để trống nếu không có media.' })
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  groupId?: string;
}
