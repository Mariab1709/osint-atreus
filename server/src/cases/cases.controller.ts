import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getCases(@Request() req: { user: { id: string } }) {
    return this.prisma.case.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post()
  async createCase(
    @Request() req: { user: { id: string } },
    @Body() body: {
      entityName: string;
      entityTypeLabel: string;
      riskScore: number;
      notes?: string;
      data: unknown;
    },
  ) {
    const existing = await this.prisma.case.findUnique({
      where: {
        userId_entityName: {
          userId: req.user.id,
          entityName: body.entityName,
        },
      },
    });

    if (existing) {
      return this.prisma.case.update({
        where: { id: existing.id },
        data: {
          riskScore: body.riskScore,
          notes: body.notes || existing.notes,
          data: JSON.stringify(body.data),
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.case.create({
      data: {
        userId: req.user.id,
        entityName: body.entityName,
        entityTypeLabel: body.entityTypeLabel,
        riskScore: body.riskScore,
        notes: body.notes || '',
        data: JSON.stringify(body.data),
      },
    });
  }

  @Put(':id')
  async updateCase(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { status?: string; notes?: string },
  ) {
    return this.prisma.case.update({
      where: { id, userId: req.user.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });
  }

  @Delete(':id')
  async deleteCase(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    await this.prisma.case.delete({
      where: { id, userId: req.user.id },
    });
    return { message: 'Caso eliminado' };
  }
}

// Historial endpoint
@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHistory(@Request() req: { user: { id: string } }) {
    return this.prisma.scan.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }
}