import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: User) {
    return await this.authService.register(body);
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() body: User) {
    return await this.authService.login(body);
  }

  // handy for testing: returns whatever validate() produced
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user: unknown }) {
    return await req.user;
  }
}
