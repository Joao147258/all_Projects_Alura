import { Test, TestingModule } from '@nestjs/testing';
import { ModAutorService } from './mod-autor.service';

describe('ModAutorService', () => {
  let service: ModAutorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModAutorService],
    }).compile();

    service = module.get<ModAutorService>(ModAutorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
