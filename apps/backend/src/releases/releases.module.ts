// ============================================================
// releases.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Release } from './entities/release.entity';
import { Song } from './entities/song.entity';
import { User } from '../users/entities/user.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Release, Song, User]),
    BullModule.registerQueue({ name: 'release-processing' }),
    MailModule,
  ],
  providers: [ReleasesService],
  controllers: [ReleasesController],
  exports: [ReleasesService],
})
export class ReleasesModule {}
