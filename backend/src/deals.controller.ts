import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DealsService } from './deals.service';
import { CreateDealDto } from './deals/dto/create-deal.dto';

@Controller('api/deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDeal(@Body() createDealDto: CreateDealDto, @Request() req) {
    return this.dealsService.createDeal(req.user.id, createDealDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmDeal(@Param('id') dealId: string, @Request() req) {
    return this.dealsService.confirmDeal(dealId, req.user.id);
  }
}
