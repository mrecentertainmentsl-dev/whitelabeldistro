// ddex.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DdexService } from './ddex.service';
import { DdexController } from './ddex.controller';
import { Release } from '../releases/entities/release.entity';
import { Song } from '../releases/entities/song.entity';
import { Setting } from '../settings/entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Release, Song, Setting])],
  providers: [DdexService],
  controllers: [DdexController],
  exports: [DdexService],
})
export class DdexModule {}
