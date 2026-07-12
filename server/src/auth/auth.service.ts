import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const sanitized = username.trim().toLowerCase();
    if (sanitized.length < 3 || password.length < 6) {
      throw new BadRequestException('El usuario debe tener al menos 3 caracteres y la contraseña al menos 6.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { username: sanitized },
    });
    if (existing) {
      throw new BadRequestException('El nombre de usuario ya está registrado');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.create({
      data: {
        username: sanitized,
        passwordHash,
        salt,
      },
      select: { id: true, username: true },
    });

    const token = this.jwtService.sign({ sub: user.id, username: user.username });

    return {
      message: 'Usuario registrado con éxito',
      user,
      token,
    };
  }

  async login(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException('Usuario y contraseña son requeridos');
    }

    const user = await this.prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username });

    return {
      message: 'Login exitoso',
      user: { id: user.id, username: user.username },
      token,
    };
  }

  async validateUserByToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true },
      });
      if (!user) throw new UnauthorizedException('Token inválido');
      return { user };
    } catch {
      throw new UnauthorizedException('Sesión expirada o token inválido');
    }
  }
}