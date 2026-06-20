import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CasesController]
})
export class CasesModule {}
