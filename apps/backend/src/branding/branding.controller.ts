import { Controller, Get, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branding } from './entities/branding.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('branding')
@Controller('branding')
export class BrandingController {
  constructor(
    @InjectRepository(Branding)
    private readonly brandingRepo: Repository<Branding>,
  ) {}

  // Public endpoint — used to load branding for any domain
  @Get('public')
  @ApiOperation({ summary: 'Get active branding for current domain' })
  async getPublicBranding(@Request() req: any) {
    const domain = req.headers['x-domain'] || req.headers.host;
    // Try domain-specific branding first, fallback to default
    let branding = await this.brandingRepo.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (!branding) {
      branding = this.brandingRepo.create({
        platformName: 'MREC Entertainment',
        primaryColor: '#7C3AED',
        secondaryColor: '#A855F7',
        accentColor: '#F59E0B',
        backgroundColor: '#0F0F0F',
        textColor: '#FFFFFF',
      });
    }
    return branding;
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Get all branding configs' })
  async findAll() {
    return this.brandingRepo.find({ order: { createdAt: 'ASC' } });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update branding config' })
  async update(@Param('id') id: string, @Body() dto: Partial<Branding>) {
    const branding = await this.brandingRepo.findOne({ where: { id } });
    if (!branding) {
      const newBranding = this.brandingRepo.create(dto);
      return this.brandingRepo.save(newBranding);
    }
    Object.assign(branding, dto);
    return this.brandingRepo.save(branding);
  }

  @Put('default/update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update default branding' })
  async updateDefault(@Body() dto: Partial<Branding>) {
    let branding = await this.brandingRepo.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (!branding) {
      branding = this.brandingRepo.create({ isActive: true });
    }
    Object.assign(branding, dto);
    return this.brandingRepo.save(branding);
  }
}
