import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiNodeModule } from './api-node/api-node.module';
import { ModAutorModule } from './mod-autor/mod-autor.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ApiNodeModule, ModAutorModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
