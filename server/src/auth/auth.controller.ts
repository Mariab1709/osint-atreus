import { Controller, Post, Get, Body, Headers, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: Record<string, string>) {
    return this.authService.register(body.username, body.password);
  }

  @Post('login')
  async login(@Body() body: Record<string, string>) {
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No autorizado, token ausente');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.validateUserByToken(token);
  }
}
