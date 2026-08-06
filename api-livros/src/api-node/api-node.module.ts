import { Module } from '@nestjs/common';
import { ApiNodeService } from './api-node.service';
import { ApiNodeController } from './api-node.controller';

@Module({
  controllers: [ApiNodeController],
  providers: [ApiNodeService],
})
export class ApiNodeModule {}
