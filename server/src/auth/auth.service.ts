import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DatabaseService) {}

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  public generateSessionToken(userId: string, username: string): string {
    const payload = {
      userId,
      username,
      exp: Date.now() + TOKEN_EXPIRY
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  public verifySessionToken(token: string): { userId: string; username: string } | null {
    try {
      const payloadJson = Buffer.from(token, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);
      
      if (payload.exp < Date.now()) {
        return null;
      }
      
      return { userId: payload.userId, username: payload.username };
    } catch {
      return null;
    }
  }

  public async register(username: string, password: string) {
    const sanitized = username.trim();
    if (sanitized.length < 3 || password.length < 6) {
      throw new BadRequestException('El usuario debe tener al menos 3 caracteres y la contraseña al menos 6.');
    }

    const existingUser = this.dbService.getUserByUsername(sanitized);
    if (existingUser) {
      throw new BadRequestException('El nombre de usuario ya está registrado');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);

    const newUser = this.dbService.createUser(sanitized, passwordHash, salt);
    const token = this.generateSessionToken(newUser.id, newUser.username);

    return {
      message: 'Usuario registrado con éxito',
      user: { id: newUser.id, username: newUser.username },
      token
    };
  }

  public async login(username: string, password: string) {
    if (!username || !password) {
      throw new BadRequestException('Usuario y contraseña son requeridos');
    }

    const user = this.dbService.getUserByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const checkHash = this.hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.generateSessionToken(user.id, user.username);

    return {
      message: 'Login exitoso',
      user: { id: user.id, username: user.username },
      token
    };
  }

  public async validateUserByToken(token: string) {
    const session = this.verifySessionToken(token);
    if (!session) {
      throw new UnauthorizedException('Sesión expirada o token inválido');
    }
    return {
      user: { id: session.userId, username: session.username }
    };
  }
}
