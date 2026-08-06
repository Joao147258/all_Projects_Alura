import { Test, TestingModule } from '@nestjs/testing';
import { ApiNodeController } from './api-node.controller';
import { ApiNodeService } from './api-node.service';

describe('ApiNodeController', () => {
  let controller: ApiNodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiNodeController],
      providers: [ApiNodeService],
    }).compile();

    controller = module.get<ApiNodeController>(ApiNodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
