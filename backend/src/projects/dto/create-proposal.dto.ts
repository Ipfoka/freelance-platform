import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @Min(0)
  price: number;
}
