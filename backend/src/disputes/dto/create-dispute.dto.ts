import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
