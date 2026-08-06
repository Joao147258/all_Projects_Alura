/*
DTO compartilhado entre criação (POST) e busca (GET).
- POST /autores: nome é obrigatório, nacionalidade opcional
- GET /autores/busca: ambos são opcionais (filtros por query string)

model Autor {
  id            Int      @id @default(autoincrement())
  nome          String
  nacionalidade String?
  livros        Livro[]
}
*/

import { IsOptional, IsString } from 'class-validator';

export class CreateModAutorDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  nacionalidade?: string;
}
