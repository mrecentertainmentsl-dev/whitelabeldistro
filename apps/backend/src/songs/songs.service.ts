// songs.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song } from '../releases/entities/song.entity';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepo: Repository<Song>,
  ) {}

  async findByRelease(releaseId: string, userId: string): Promise<Song[]> {
    return this.songRepo.find({ where: { releaseId, userId }, order: { trackNumber: 'ASC' } });
  }

  async findOne(id: string, userId: string): Promise<Song> {
    const song = await this.songRepo.findOne({ where: { id } });
    if (!song) throw new NotFoundException('Song not found');
    if (song.userId !== userId) throw new ForbiddenException('Access denied');
    return song;
  }

  async update(id: string, userId: string, dto: Partial<Song>): Promise<Song> {
    const song = await this.findOne(id, userId);
    const { id: _id, userId: _uid, releaseId: _rid, ...safe } = dto as any;
    Object.assign(song, safe);
    return this.songRepo.save(song);
  }

  async remove(id: string, userId: string): Promise<void> {
    const song = await this.findOne(id, userId);
    await this.songRepo.remove(song);
  }
}
