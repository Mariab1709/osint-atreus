import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global() // Hacemos que el módulo de base de datos sea global para no tener que importarlo individualmente
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
