import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Request, Query, UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReleasesService, CreateReleaseDto, UpdateReleaseDto } from './releases.service';

@ApiTags('releases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  // ── Artist routes ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new release (draft)' })
  create(@Request() req: any, @Body() dto: CreateReleaseDto) {
    return this.releasesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my releases' })
  findAll(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.releasesService.findAll(req.user.id, page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a release by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.releasesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a release (autosave/wizard)' })
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateReleaseDto) {
    return this.releasesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft release' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.releasesService.delete(id, req.user.id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a release for QC review' })
  submit(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { submissionNotes?: string },
  ) {
    return this.releasesService.submit(id, req.user.id, body?.submissionNotes);
  }

  // ── Admin routes ──────────────────────────────────────────────────────────

  @Post(':id/approve')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Approve a release' })
  approve(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { notes?: string },
  ) {
    return this.releasesService.approve(id, req.user.id, body?.notes);
  }

  @Post(':id/reject')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Reject a release' })
  reject(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason: string },
  ) {
    return this.releasesService.reject(id, req.user.id, body.reason);
  }
}
