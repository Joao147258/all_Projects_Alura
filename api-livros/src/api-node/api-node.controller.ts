import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiNodeService } from './api-node.service';
import { CreateApiNodeDto } from './dto/create-api-node.dto';
import { UpdateApiNodeDto } from './dto/update-api-node.dto';

@Controller('api-node')
export class ApiNodeController {
  constructor(private readonly apiNodeService: ApiNodeService) {}

  @Post()
  create(@Body() createApiNodeDto: CreateApiNodeDto) {
    return this.apiNodeService.create(createApiNodeDto);
  }

  @Get()
  findAll() {
    return this.apiNodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiNodeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApiNodeDto: UpdateApiNodeDto) {
    return this.apiNodeService.update(+id, updateApiNodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiNodeService.remove(+id);
  }
}
