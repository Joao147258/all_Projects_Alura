// prisma/seed.ts — dados de teste para a livraria
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.livro.deleteMany();
    await prisma.autor.deleteMany();

    const machado = await prisma.autor.create({
        data: { nome: 'Machado de Assis', nacionalidade: 'Brasileiro' },
    });
    const tolkien = await prisma.autor.create({
        data: { nome: 'J.R.R. Tolkien', nacionalidade: 'Britânico' },
    });
    const orwell = await prisma.autor.create({
        data: { nome: 'George Orwell', nacionalidade: 'Britânico' },
    });
    const clarice = await prisma.autor.create({
        data: { nome: 'Clarice Lispector', nacionalidade: 'Brasileira' },
    });
    const homero = await prisma.autor.create({
        data: { nome: 'Homero' },
    });

    const livros = [
        { titulo: 'Dom Casmurro', autorId: machado.id, editora: 'Garnier', numeroPaginas: 256 },
        { titulo: 'Memorias Postumas de Bras Cubas', autorId: machado.id, editora: 'Garnier', numeroPaginas: 368 },
        { titulo: 'Quincas Borba', autorId: machado.id, editora: 'Garnier', numeroPaginas: 302 },
        { titulo: 'O Hobbit', autorId: tolkien.id, editora: 'Allen & Unwin', numeroPaginas: 310 },
        { titulo: 'A Sociedade do Anel', autorId: tolkien.id, editora: 'Allen & Unwin', numeroPaginas: 576 },
        { titulo: 'As Duas Torres', autorId: tolkien.id, editora: 'Allen & Unwin', numeroPaginas: 448 },
        { titulo: 'O Retorno do Rei', autorId: tolkien.id, editora: 'Allen & Unwin', numeroPaginas: 512 },
        { titulo: '1984', autorId: orwell.id, editora: 'Secker & Warburg', numeroPaginas: 328 },
        { titulo: 'A Revolucao dos Bichos', autorId: orwell.id, editora: 'Secker & Warburg', numeroPaginas: 152 },
        { titulo: 'A Hora da Estrela', autorId: clarice.id, editora: 'Rocco', numeroPaginas: 88 },
        { titulo: 'Perto do Coracao Selvagem', autorId: clarice.id, editora: 'Rocco', numeroPaginas: 192 },
        { titulo: 'Iliada', autorId: homero.id, editora: 'Penguin', numeroPaginas: 704 },
        { titulo: 'Odisseia', autorId: homero.id, editora: 'Penguin', numeroPaginas: 560 },
    ];

    for (const livro of livros) {
        await prisma.livro.create({ data: livro });
    }

    const totalAutores = await prisma.autor.count();
    const totalLivros = await prisma.livro.count();
    console.log(`Seed concluido: ${totalAutores} autores, ${totalLivros} livros`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());