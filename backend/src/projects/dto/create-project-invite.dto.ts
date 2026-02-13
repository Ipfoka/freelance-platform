import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectInviteDto {
  @IsString()
  @IsNotEmpty()
  freelancerId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
