import { Module } from '@nestjs/common';
import { OsintService } from './osint.service';
import { OsintController } from './osint.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OsintController],
  providers: [OsintService],
})
export class OsintModule {}
