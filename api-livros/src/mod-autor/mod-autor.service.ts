import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModAutorService {
  constructor(private readonly prisma: PrismaService) { }


  async BuscaNome(nome: string) {
    const Nome_Autor = await this.prisma.autor.findFirst({
      where: { nome },
      select: {
        id: true,
        nome: true,
        nacionalidade: true,

        livros: {
          select: {
            id: true,
            titulo: true,
            editora: true,
          }
        }
      },
    })
    if (!Nome_Autor) throw new BadRequestException('Autor Não encontrado');
    return Nome_Autor
  }

  async Busca_Por_Nacionalidade(nacionalidade: string) {
    const Nacionalidade = await this.prisma.autor.findMany({
      where: { nacionalidade },
      select: {
        id: true,
        nome: true,
        nacionalidade: true,

        livros: {
          select: {
            id: true,
            titulo: true,
            editora: true,
          }
        }
      }
    })
    if (Nacionalidade.length === 0) throw new BadRequestException('Nenhum altor com essa nacionalidade');
    return Nacionalidade
  }

}
