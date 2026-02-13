import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Patch,
} from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, Min, IsString } from 'class-validator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './disputes/dto/create-dispute.dto';

export class ResolveDisputeDto {
  @IsString()
  @IsIn(['release', 'return', 'partial'])
  resolution: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

@Controller('api/deals/:dealId/dispute')
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDispute(
    @Param('dealId') dealId: string,
    @Body() createDisputeDto: CreateDisputeDto,
    @Request() req,
  ) {
    return this.disputesService.createDispute(
      dealId,
      req.user.id,
      createDisputeDto.title,
      createDisputeDto.description,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
    @Request() req,
  ) {
    return this.disputesService.resolveDispute(
      disputeId,
      resolveDisputeDto.resolution,
      req.user.id,
      resolveDisputeDto.amount,
    );
  }
}
