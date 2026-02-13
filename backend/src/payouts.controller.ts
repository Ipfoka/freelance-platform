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
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './payouts/dto/create-payout.dto';

@Controller('api/payouts')
export class PayoutsController {
  constructor(private payoutsService: PayoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayout(@Body() createPayoutDto: CreatePayoutDto, @Request() req) {
    return this.payoutsService.createPayoutRequest(
      req.user.id,
      createPayoutDto.amount,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  async adminProcessPayout(@Param('id') payoutId: string) {
    return this.payoutsService.adminProcessPayout(payoutId);
  }
}
