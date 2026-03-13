import { Controller, Get, Patch, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @Patch('me')
  updateProfile(@Request() req: any, @Body() dto: any) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Post('me/change-password')
  async changePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    await this.usersService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
    return { message: 'Password changed successfully' };
  }
}
