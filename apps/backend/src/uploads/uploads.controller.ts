import {
  Controller, Post, Get, Body, Param, UseGuards,
  Request, Query, BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNumber, IsOptional } from 'class-validator';

class RequestUploadUrlDto {
  @IsString()
  filename: string;

  @IsString()
  contentType: string;

  @IsString()
  uploadType: 'audio' | 'artwork' | 'avatar' | 'logo';
}

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get presigned S3 upload URL' })
  async getPresignedUrl(@Body() dto: RequestUploadUrlDto, @Request() req: any) {
    const prefixMap = {
      audio: `audio/${req.user.sub}`,
      artwork: `artwork/${req.user.sub}`,
      avatar: `avatars/${req.user.sub}`,
      logo: `branding/logos`,
    };

    if (dto.uploadType === 'audio') {
      this.storageService.validateAudioFile(dto.contentType, dto.filename);
    } else if (dto.uploadType === 'artwork') {
      this.storageService.validateArtworkFile(dto.contentType, dto.filename);
    }

    const presigned = await this.storageService.generatePresignedUploadUrl(
      dto.filename,
      dto.contentType,
      { prefix: prefixMap[dto.uploadType] || 'uploads' },
    );

    return {
      ...presigned,
      publicUrl: this.storageService.getPublicUrl(presigned.key),
    };
  }

  @Get('download-url/:key')
  @ApiOperation({ summary: 'Get presigned download URL for a file' })
  async getDownloadUrl(@Param('key') key: string, @Request() req: any) {
    const url = await this.storageService.generatePresignedDownloadUrl(
      decodeURIComponent(key),
      3600,
    );
    return { url, expiresIn: 3600 };
  }
}
