import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdmin, LoginAdmin } from './entities/admin.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // One-time setup endpoint. It works only while ADMIN_BOOTSTRAP_SECRET is set
  // and no admin record has ever been created.
  @Post('bootstrap-admin')
  bootstrapAdmin(
    @Body() body: CreateAdmin,
    @Headers('x-admin-bootstrap-secret') bootstrapSecret?: string,
  ) {
    return this.authService.bootstrapFirstAdmin(body, bootstrapSecret);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() body: LoginAdmin) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { userId: number; email: string } }) {
    return req.user;
  }
}
