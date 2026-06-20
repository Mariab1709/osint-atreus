import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { OsintModule } from './osint/osint.module';
import { CasesModule } from './cases/cases.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    OsintModule,
    CasesModule
  ]
})
export class AppModule {}
