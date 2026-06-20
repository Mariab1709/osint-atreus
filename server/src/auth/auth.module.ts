import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { StrictAuthGuard, OptionalAuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, StrictAuthGuard, OptionalAuthGuard],
  exports: [AuthService, StrictAuthGuard, OptionalAuthGuard]
})
export class AuthModule {}
