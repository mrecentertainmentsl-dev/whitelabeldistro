import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { User } from '../users/entities/user.entity';
import { Release, ReleaseStatus } from '../releases/entities/release.entity';
import { Song } from '../releases/entities/song.entity';
import { AdminLog } from './entities/admin-log.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,
    @InjectRepository(Song)
    private readonly songRepo: Repository<Song>,
    @InjectRepository(AdminLog)
    private readonly logRepo: Repository<AdminLog>,
  ) {}

  // ─── Dashboard Overview ─────────────────────────────────────────────
  @Get('overview')
  @ApiOperation({ summary: 'Dashboard statistics' })
  async getOverview() {
    const [
      totalUsers, activeUsers,
      totalReleases, pendingReleases, approvedReleases,
      rejectedReleases, distributedReleases,
      totalSongs,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
      this.releaseRepo.count(),
      this.releaseRepo.count({ where: { status: ReleaseStatus.PENDING } }),
      this.releaseRepo.count({ where: { status: ReleaseStatus.APPROVED } }),
      this.releaseRepo.count({ where: { status: ReleaseStatus.REJECTED } }),
      this.releaseRepo.count({ where: { status: ReleaseStatus.DISTRIBUTED } }),
      this.songRepo.count(),
    ]);

    // Recent releases
    const recentReleases = await this.releaseRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // New users last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at > :date', { date: thirtyDaysAgo })
      .getCount();

    return {
      users: { total: totalUsers, active: activeUsers, newThisMonth: newUsersThisMonth },
      releases: {
        total: totalReleases,
        pending: pendingReleases,
        approved: approvedReleases,
        rejected: rejectedReleases,
        distributed: distributedReleases,
      },
      songs: { total: totalSongs },
      recentReleases,
    };
  }

  // ─── Users ──────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async getUsers(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const qb = this.userRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .orderBy('u.created_at', 'DESC')
      .take(limit)
      .skip(skip);

    if (query.search) {
      qb.where('u.email ILIKE :s OR u.first_name ILIKE :s OR u.last_name ILIKE :s', {
        s: `%${query.search}%`,
      });
    }
    if (query.role) {
      qb.andWhere('role.name = :role', { role: query.role });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.userRepo.findOne({ where: { id }, relations: ['role'] });
  }

  @Patch('users/:id/toggle-active')
  async toggleUserActive(@Param('id') id: string, @Request() req: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return { error: 'User not found' };
    user.isActive = !user.isActive;
    await this.userRepo.save(user);
    await this.logAction(req.user.sub, 'toggle_user_active', 'user', id, { isActive: user.isActive });
    return { isActive: user.isActive };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    await this.userRepo.delete(id);
    await this.logAction(req.user.sub, 'delete_user', 'user', id);
    return { success: true };
  }

  // ─── Releases ───────────────────────────────────────────────────────
  @Get('releases')
  @ApiOperation({ summary: 'List all releases' })
  async getReleases(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const qb = this.releaseRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.songs', 'songs')
      .orderBy('r.created_at', 'DESC')
      .take(limit)
      .skip(skip);

    if (query.status) qb.where('r.status = :status', { status: query.status });
    if (query.search) {
      qb.andWhere('r.title ILIKE :s OR user.email ILIKE :s', { s: `%${query.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  @Get('releases/:id')
  async getRelease(@Param('id') id: string) {
    return this.releaseRepo.findOne({ where: { id }, relations: ['user', 'songs'] });
  }

  @Patch('releases/:id/metadata')
  async updateReleaseMetadata(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    const release = await this.releaseRepo.findOne({ where: { id } });
    if (!release) return { error: 'Not found' };
    const old = { ...release };
    Object.assign(release, dto);
    await this.releaseRepo.save(release);
    await this.logAction(req.user.sub, 'edit_release_metadata', 'release', id, old, dto);
    return release;
  }

  // ─── System Logs ────────────────────────────────────────────────────
  @Get('logs')
  @ApiOperation({ summary: 'System activity logs' })
  async getLogs(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await this.logRepo.findAndCount({
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });
    return { data, total, page, limit };
  }

  // ─── Internal helpers ────────────────────────────────────────────────
  private async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId?: string,
    oldValue?: any,
    newValue?: any,
  ) {
    const log = this.logRepo.create({
      adminId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
    });
    await this.logRepo.save(log);
  }
}
