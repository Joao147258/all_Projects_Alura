import { Test, TestingModule } from '@nestjs/testing';
import { ModAutorController } from './mod-autor.controller';
import { ModAutorService } from './mod-autor.service';

describe('ModAutorController', () => {
  let controller: ModAutorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModAutorController],
      providers: [ModAutorService],
    }).compile();

    controller = module.get<ModAutorController>(ModAutorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
