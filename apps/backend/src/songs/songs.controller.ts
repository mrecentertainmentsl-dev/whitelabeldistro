import { Controller, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SongsService } from './songs.service';

@ApiTags('songs')
@Controller('songs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get('release/:releaseId')
  findByRelease(@Param('releaseId') releaseId: string, @Request() req: any) {
    return this.songsService.findByRelease(releaseId, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.songsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.songsService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.songsService.remove(id, req.user.sub);
  }
}
