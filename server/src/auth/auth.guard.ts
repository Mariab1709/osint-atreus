import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class StrictAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No autorizado, token ausente');
    }
    const token = authHeader.split(' ')[1];
    const session = this.authService.verifySessionToken(token);
    if (!session) {
      throw new UnauthorizedException('Sesión expirada o token inválido');
    }
    request.user = session;
    return true;
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = this.authService.verifySessionToken(token);
      if (session) {
        request.user = session;
      }
    }
    return true;
  }
}
