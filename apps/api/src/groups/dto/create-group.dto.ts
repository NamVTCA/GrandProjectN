import { IsNotEmpty, IsString, IsOptional, IsArray } from "class-validator";

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
}