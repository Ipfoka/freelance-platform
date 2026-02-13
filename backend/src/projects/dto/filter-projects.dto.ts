import { IsString, IsArray, IsOptional, IsNumberString } from 'class-validator';

export class FilterProjectsDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsNumberString()
  @IsOptional()
  budget?: string;

  @IsString()
  @IsOptional()
  q?: string; // Поиск по заголовку и описанию
}
