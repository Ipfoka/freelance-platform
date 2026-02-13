import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService } from '../users.service';
import { S3Service } from '../s3/s3.service';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;
}

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private s3Service: S3Service,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req,
  ) {
    return this.usersService.update(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar-upload-url')
  @HttpCode(HttpStatus.OK)
  async getAvatarUploadUrl(
    @Body() getPresignedUrlDto: GetPresignedUrlDto,
    @Request() req,
  ) {
    return this.s3Service.getAvatarUploadUrl(
      req.user.id,
      getPresignedUrlDto.fileName,
      getPresignedUrlDto.fileType,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/boost-offer')
  @HttpCode(HttpStatus.OK)
  async getBoostOffer() {
    return this.usersService.getBoostOffer();
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/boost-profile')
  @HttpCode(HttpStatus.OK)
  async purchaseProfileBoost(@Request() req) {
    return this.usersService.purchaseProfileBoost(req.user.id);
  }
}
