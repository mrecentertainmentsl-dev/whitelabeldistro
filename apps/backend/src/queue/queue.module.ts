import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseProcessor } from './release.processor';
import { Release } from '../releases/entities/release.entity';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'release-processing' }),
    TypeOrmModule.forFeature([Release]),
  ],
  providers: [ReleaseProcessor],
  exports: [BullModule],
})
export class QueueModule {}
