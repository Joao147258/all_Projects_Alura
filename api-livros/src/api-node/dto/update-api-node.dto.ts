import { PartialType } from '@nestjs/mapped-types';
import { CreateApiNodeDto } from './create-api-node.dto';

export class UpdateApiNodeDto extends PartialType(CreateApiNodeDto) {}
