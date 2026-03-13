import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Release } from '../releases/entities/release.entity';
import { Song } from '../releases/entities/song.entity';
import { AdminLog } from './entities/admin-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Release, Song, AdminLog])],
  controllers: [AdminController],
  exports: [TypeOrmModule],
})
export class AdminModule {}
