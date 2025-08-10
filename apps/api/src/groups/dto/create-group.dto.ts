import { IsNotEmpty, IsString, IsOptional, IsArray,IsIn } from "class-validator";

export class CreateGroupDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interestIds?: string[];

// ✅ THÊM TRƯỜNG NÀY VÀO
  @IsString()
  @IsIn(['public', 'private']) // Chỉ chấp nhận 1 trong 2 giá trị này
  @IsOptional() // Tùy chọn, nếu không có sẽ lấy giá trị mặc định
  privacy?: 'public' | 'private';
}