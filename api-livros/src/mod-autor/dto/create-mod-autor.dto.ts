/*
model Autor {
  id            Int      @id @default(autoincrement())
  nome          String
  nacionalidade String?
  livros        Livro[]                             // relação reversa (virtual)

  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt
}

*/

export class CreateModAutorDto {
    nome!: string;
    nacionalidade!: string;
    livro!: string;
}
