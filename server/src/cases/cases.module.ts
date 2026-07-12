import { Module } from '@nestjs/common';
import { CasesController, HistoryController } from './cases.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CasesController, HistoryController],
})
export class CasesModule {}