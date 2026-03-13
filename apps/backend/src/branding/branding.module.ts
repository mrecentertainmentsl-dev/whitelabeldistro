// branding.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branding } from './entities/branding.entity';
import { BrandingController } from './branding.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Branding])],
  controllers: [BrandingController],
  exports: [TypeOrmModule],
})
export class BrandingModule {}
