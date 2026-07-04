import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { OsintService } from './osint.service';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { PrismaService } from '../database/prisma.service';

@Controller('scan')
export class OsintController {
  constructor(
    private readonly osintService: OsintService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  async scan(
    @Query('query') query: string,
    @Request() req: { user?: { id: string } },
  ) {
    if (!query || !query.trim()) {
      throw new Error('Query parameter is required');
    }

    const result = await this.osintService.scan(query);

    if (req.user) {
      await this.prisma.scan.create({
        data: {
          userId: req.user.id,
          query: query.trim(),
          entityType: result.riskProfile.entityTypeLabel,
          riskScore: result.riskProfile.riskScore,
          data: JSON.stringify(result),
        },
      });
    }

    return result;
  }
}
