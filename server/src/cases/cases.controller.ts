import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Req, 
  UseGuards, 
  BadRequestException, 
  NotFoundException,
  Inject
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StrictAuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
  };
}

interface CreateCaseDto {
  entityName: string;
  entityTypeLabel: string;
  riskScore?: number;
  notes?: string;
  data?: unknown;
}

interface UpdateCaseDto {
  status?: 'En revisión' | 'Sospechoso' | 'Cerrado' | 'Seguro';
  notes?: string;
}

@Controller()
@UseGuards(StrictAuthGuard) // Todo este controlador requiere autenticación estricta
export class CasesController {
  constructor(@Inject(DatabaseService) private readonly dbService: DatabaseService) {}

  /**
   * GET /api/cases
   */
  @Get('cases')
  async getCases(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.dbService.getCasesByUserId(userId);
  }

  /**
   * POST /api/cases
   */
  @Post('cases')
  async createCase(@Body() body: CreateCaseDto, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const { entityName, entityTypeLabel, riskScore, notes, data } = body;

    if (!entityName || !entityTypeLabel) {
      throw new BadRequestException('Nombre y tipo de entidad son obligatorios');
    }

    const newCase = this.dbService.addCase(
      userId,
      entityName,
      entityTypeLabel,
      Number(riskScore) || 0,
      notes || '',
      data
    );

    return {
      message: 'Caso guardado con éxito',
      case: newCase
    };
  }

  /**
   * PUT /api/cases/:id
   */
  @Put('cases/:id')
  async updateCase(@Param('id') id: string, @Body() body: UpdateCaseDto, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const { status, notes } = body;

    const validStatuses = ['En revisión', 'Sospechoso', 'Cerrado', 'Seguro'];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException('Estado de caso no válido');
    }

    const updatedCase = this.dbService.updateCase(userId, id, { status, notes });
    if (!updatedCase) {
      throw new NotFoundException('Caso no encontrado o no pertenece a este usuario');
    }

    return {
      message: 'Caso actualizado con éxito',
      case: updatedCase
    };
  }

  /**
   * DELETE /api/cases/:id
   */
  @Delete('cases/:id')
  async deleteCase(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const success = this.dbService.deleteCase(userId, id);
    if (!success) {
      throw new NotFoundException('Caso no encontrado o no pertenece a este usuario');
    }

    return { message: 'Caso eliminado con éxito' };
  }

  /**
   * GET /api/history
   */
  @Get('history')
  async getHistory(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.dbService.getScansByUserId(userId);
  }
}
