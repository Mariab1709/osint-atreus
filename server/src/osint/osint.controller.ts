import { Controller, Get, Query, Req, UseGuards, BadRequestException, Inject } from '@nestjs/common';
import { OsintService } from './osint.service';
import { OptionalAuthGuard } from '../auth/auth.guard';

import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

@Controller()
export class OsintController {
  constructor(@Inject(OsintService) private readonly osintService: OsintService) {}

  @Get('scan')
  @UseGuards(OptionalAuthGuard)
  async scan(@Query('query') query: string, @Req() req: RequestWithUser) {
    if (!query || !query.trim()) {
      throw new BadRequestException('La consulta no puede estar vacía');
    }
    const userId = req.user?.userId;
    return this.osintService.scan(query, userId);
  }
}
