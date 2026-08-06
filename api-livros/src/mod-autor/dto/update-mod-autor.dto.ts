import { PartialType } from '@nestjs/mapped-types';
import { CreateModAutorDto } from './create-mod-autor.dto';

export class UpdateModAutorDto extends PartialType(CreateModAutorDto, {}) { }
