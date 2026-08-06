import { Test, TestingModule } from '@nestjs/testing';
import { ApiNodeService } from './api-node.service';

describe('ApiNodeService', () => {
  let service: ApiNodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiNodeService],
    }).compile();

    service = module.get<ApiNodeService>(ApiNodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
