import { Module } from '@nestjs/common';
import { ModAutorService } from './mod-autor.service';
import { ModAutorController } from './mod-autor.controller';

@Module({
  controllers: [ModAutorController],
  providers: [ModAutorService],
})
export class ModAutorModule {}
