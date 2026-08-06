import { Controller, Get, Query } from '@nestjs/common';
import { ModAutorService } from './mod-autor.service';
import { CreateModAutorDto } from './dto/create-mod-autor.dto';

@Controller('autores')
export class ModAutorController {
  constructor(private readonly modAutorService: ModAutorService) { }

  // GET /autores/busca?nome=Machado
  // GET /autores/busca?nacionalidade=Brasileiro
  // GET /autores/busca (sem parâmetros — futuramente lista todos)
  @Get('busca')
  buscar(@Query() dto: CreateModAutorDto) {
    // Decide qual método do service chamar baseado no que veio preenchido
    if (dto.nome) {
      return this.modAutorService.BuscaNome(dto.nome);
    }
    if (dto.nacionalidade) {
      return this.modAutorService.Busca_Por_Nacionalidade(dto.nacionalidade);
    }
    // Sem filtro — futuro: listar todos
    return { message: 'Informe nome ou nacionalidade como query param' };
  }
}