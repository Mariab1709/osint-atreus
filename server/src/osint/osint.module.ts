import { Module } from '@nestjs/common';
import { OsintController } from './osint.controller';
import { OsintService } from './osint.service';
import { OfacService } from './ofac.service';
import { BlockchainTagsService } from './blockchain-tags.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OsintController],
  providers: [OsintService, OfacService, BlockchainTagsService],
  exports: [OsintService, OfacService, BlockchainTagsService],
})
export class OsintModule {}