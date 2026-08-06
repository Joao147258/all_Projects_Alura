import { Injectable } from '@nestjs/common';
import { CreateApiNodeDto } from './dto/create-api-node.dto';
import { UpdateApiNodeDto } from './dto/update-api-node.dto';

@Injectable()
export class ApiNodeService {
  create(createApiNodeDto: CreateApiNodeDto) {
    return 'This action adds a new apiNode';
  }

  findAll() {
    return `This action returns all apiNode`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiNode`;
  }

  update(id: number, updateApiNodeDto: UpdateApiNodeDto) {
    return `This action updates a #${id} apiNode`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiNode`;
  }
}
