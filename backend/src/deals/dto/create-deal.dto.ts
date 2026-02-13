import {
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.USD;
}
