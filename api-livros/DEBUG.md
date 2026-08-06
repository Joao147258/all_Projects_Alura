# Diário de Depuração: NestJS + Prisma v7 + SQLite

Projeto: `api-livros` — migração do curso Alura de Express para NestJS
Stack: NestJS 11, Prisma 7.9.1, SQLite (via libsql), swc compiler, Codespace GitHub

---

## Contexto Inicial

O objetivo era pegar o domínio do curso da Alura (API REST de livraria com autores e livros) e implementá-lo em NestJS com Prisma e SQLite — em vez de Express com Mongoose e MongoDB como o curso original.

O ambiente era um GitHub Codespace com Node.js v24.14.0, NestJS 11 (que usa o compilador swc por padrão), Prisma v7 (que introduziu várias breaking changes) e SQLite como banco local.

Cada erro abaixo é apresentado com: (1) o que o computador entendeu, (2) por que aquilo é um erro, (3) como corrigimos, e (4) o que aprendemos sobre o sistema.

---

## ERRO 1: `command not found: prisma`

### O que aconteceu

Tentamos rodar `prisma init` diretamente no terminal do Codespace e recebemos `zsh: command not found: prisma`.

### Por que é um erro

Diferente do `npm` ou `node`, o Prisma não vem instalado no sistema. É um pacote npm como qualquer outro — precisa ser instalado (global ou localmente) antes de poder ser chamado como comando.

### O que o computador entendeu

O shell (zsh) procurou nos diretórios listados na variável `PATH` por um executável chamado `prisma`. Não encontrou nenhum. Retornou `command not found`.

### Correção

```bash
npm install prisma --save-dev  # instala localmente no projeto
npx prisma init                 # executa sem instalação global
```

O `npx` é um executor de pacotes npm que baixa e executa temporariamente — útil para CLI tools que você não quer instalar globalmente.

### Conceito: npx vs instalação global

`npm install -g prisma` instalaria o comando `prisma` globalmente no sistema, disponível em qualquer projeto. `npx prisma` baixa e executa na hora, sem poluir o sistema. Para projetos, `--save-dev` + `npx` é a prática recomendada — cada projeto tem sua própria versão do Prisma, evitando conflitos.

---

## ERRO 2: `A folder called prisma already exists`

### O que aconteceu

Ao rodar `npx prisma init`, o Prisma detectou que a pasta `prisma/` já existia e recusou criar o projeto do zero.

### Por que é um erro

O template do NestJS ou o boilerplate inicial já havia criado `prisma/schema.prisma` e `prisma.config.ts`. O `prisma init` é um comando de primeiro uso — ele assume que você está começando do zero e não sobrescreve arquivos existentes para evitar perda de dados.

### O que o computador entendeu

O Prisma verificou a existência da pasta `prisma/` no diretório atual. Como ela já existia (provavelmente com um schema básico de template), o comando abortou com a mensagem de erro.

### Correção

Não rodar `prisma init`. Em vez disso, editar manualmente os arquivos existentes:
- `prisma/schema.prisma` → definir os models Autor e Livro
- `prisma.config.ts` → configurar URL do SQLite e migrations

### Lição

Ferramentas de scaffolding (`init`, `create`, `new`) são para o primeiro uso. Depois que a estrutura existe, a manutenção é manual.

---

## ERRO 3: `PrismaClient was instantiated without any options`

### O que aconteceu

Ao tentar rodar o seed (`npx prisma db seed`), o PrismaClient lançou um erro de inicialização dizendo que foi instanciado "sem opções" e que "um driver adapter é obrigatório".

### Por que é um erro — a breaking change do Prisma v7

Esta é a mudança mais importante do Prisma v6 para o v7. No v6, você podia fazer:

```typescript
const prisma = new PrismaClient(); // v6: funciona com SQLite
```

No v7, **todo banco exige driver adapter**. Mesmo o SQLite, que antes era tratado como caso especial, agora precisa de um adapter explícito. O Prisma v7 separou a camada de conexão (driver adapter) da camada de ORM (PrismaClient). Isso dá mais flexibilidade (você escolhe o driver), mas quebra a compatibilidade retroativa.

### O que o computador entendeu

O construtor do `PrismaClient` no v7 verifica se recebeu um objeto com a propriedade `adapter`. Se não recebeu, lança `PrismaClientInitializationError` porque não sabe como se conectar ao banco.

### Correção

```bash
npm install @prisma/adapter-libsql @libsql/client
```

```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
```

O adapter `@prisma/adapter-libsql` é o driver oficial para SQLite no Prisma v7. Ele usa a biblioteca `libsql` (um fork moderno do SQLite) como motor de conexão.

### Conceito: Driver Adapter Pattern

O Prisma implementa o padrão Adapter (GoF): o `PrismaClient` espera uma interface genérica de conexão, e cada driver adapter traduz essa interface para um banco específico. É o mesmo padrão que o NestJS usa com `@nestjs/platform-express` vs `@nestjs/platform-fastify` — o framework não sabe qual servidor HTTP está por baixo, só conhece a interface.

### Por que libsql e não o SQLite nativo?

O ecossistema do Prisma escolheu o libsql como padrão para SQLite porque ele oferece:
- Suporte a replicação
- Melhor performance em ambientes serverless
- API compatível com o SQLite tradicional

---

## ERRO 4: Unicode nos comentários quebra o esbuild (tsx)

### O que aconteceu

Ao rodar `npx tsx prisma/seed.ts`, o esbuild (bundler usado pelo tsx) lançou um erro de transformação na linha 62: `Unexpected "▣"`.

### Por que é um erro

O arquivo `seed.ts` tinha comentários visuais com caracteres Unicode de desenho de caixa:
```
// ─── Autores ───────────────────────────────────────────────────────
```

O `tsx` usa o esbuild internamente para transpilar TypeScript para JavaScript antes de executar. O esbuild, por questões de performance, tem um parser mais restrito que o TypeScript tradicional — ele não reconhece certos caracteres Unicode mesmo dentro de comentários.

### O que o computador entendeu

O parser do esbuild encontrou o caractere `▣` (U+25A3) e não soube como classificá-lo na árvore sintática. Mesmo estando dentro de um comentário (que deveria ser ignorado), o parser do esbuild é mais sensível a caracteres não-ASCII que o parser do TypeScript.

### Correção

Substituir os separadores visuais por comentários ASCII simples:
```typescript
// Autores
// Tolkien
```

### Lição

Ferramentas de build (esbuild, swc, etc.) priorizam velocidade sobre compatibilidade total. O que funciona no VS Code ou no `tsc` pode quebrar no bundler. Caracteres Unicode em comentários são um exemplo clássico.

---

## ERRO 5: `PrismaLibSQL` vs `PrismaLibSql` (capitalização sutil)

### O que aconteceu

O TypeScript reportou que `@prisma/adapter-libsql` não exporta `PrismaLibSQL`, mas sugere `PrismaLibSql`.

### Por que é um erro

A diferença é de um caractere: `SQL` (tudo maiúsculo) vs `Sql` (só S maiúsculo). Em TypeScript, nomes de classes e exports são case-sensitive. `PrismaLibSQL` e `PrismaLibSql` são identificadores diferentes.

A causa raiz: o nome oficial na documentação e em exemplos da internet às vezes usa `PrismaLibSQL` (tratando SQL como sigla), mas o código fonte do pacote exporta `PrismaLibSql` (seguindo a convenção camelCase do JavaScript, onde siglas com mais de 2 letras ficam em PascalCase só na primeira: `PrismaLibSql`, não `PrismaLibSQL`).

### O que o computador entendeu

O module resolver do TypeScript encontrou o arquivo de declarações do pacote, localizou a exportação `PrismaLibSql`, e comparou com o nome que escrevemos (`PrismaLibSQL`). Como são strings diferentes, reportou "membro não encontrado".

### Correção

Trocar todas as ocorrências de `PrismaLibSQL` por `PrismaLibSql`:
```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql';
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
```

### Conceito: Convenções de nomenclatura em TypeScript

| Padrão | Exemplo | Quando usar |
|--------|---------|-------------|
| PascalCase | `PrismaLibSql` | Classes, interfaces, tipos |
| camelCase | `prismaLibSql` | Variáveis, funções, métodos |
| UPPER_SNAKE | `DATABASE_URL` | Constantes, env vars |

Siglas em PascalCase: se a sigla tem 2 letras, fica toda maiúscula (`IOStream`). Se tem 3+, só a primeira letra fica maiúscula (`SqlStream`, não `SQLStream`). Isso evita confusão com siglas consecutivas.

---

## ERRO 6: `Argumento do tipo 'Client' não é atribuível ao parâmetro do tipo 'Config'`

### O que aconteceu

Tentamos criar o adapter assim:
```typescript
import { createClient } from '@libsql/client';
const libsql = createClient({ url: 'file:./dev.db' });
const adapter = new PrismaLibSql(libsql); // ❌ TypeScript reclama
```

O TypeScript reportou que `Client` (tipo retornado por `createClient`) não é compatível com `Config` (tipo esperado pelo construtor do `PrismaLibSql`).

### Por que é um erro — duas formas de usar o adapter

O `PrismaLibSql` aceita duas formas de construção, dependendo da versão:

**Forma 1 (versões antigas/docs):** recebe uma instância de Client do libsql
**Forma 2 (versão atual):** recebe um objeto de configuração `{ url: string }`

Estávamos usando a forma 1 (instanciando o Client manualmente), mas a versão instalada (`@prisma/adapter-libsql` 7.9.1) espera a forma 2.

### O que o computador entendeu

O TypeScript verificou a assinatura do construtor de `PrismaLibSql`:
```typescript
constructor(config: { url: string })
```

E comparou com o argumento passado: uma instância de `Client` do `@libsql/client`. A estrutura de `Client` não tem a propriedade `url` que `Config` exige. TypeScript: "não é atribuível".

### Correção

```typescript
// ❌ Forma antiga — instancia Client manualmente
import { createClient } from '@libsql/client';
const libsql = createClient({ url: 'file:./dev.db' });
const adapter = new PrismaLibSql(libsql);

// ✅ Forma atual — passa config direto
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
// O import de @libsql/client nem é necessário
```

### Lição

Bibliotecas em evolução rápida (Prisma v7 saiu recentemente) têm documentação e exemplos desatualizados na internet. A fonte da verdade é o tipo TypeScript — se o tipo não aceita, a chamada está errada, independente do que exemplos online mostrem.

---

## ERRO 7: `SQLITE_ERROR: no such table: main.Livro`

### O que aconteceu

O seed conectou ao banco, mas ao tentar `prisma.livro.deleteMany()`, o SQLite respondeu que a tabela `Livro` não existe.

### Por que é um erro — o problema dos dois bancos

Este erro revelou um problema de arquitetura de arquivos: tínhamos **dois bancos de dados diferentes** no projeto.

O `prisma db push` criou as tabelas em um arquivo:
```
prisma.config.ts → url: "file:./dev.db" → api-livros/dev.db
```

Mas o `seed.ts` e o `PrismaService` procuravam em outro:
```
seed.ts → url: "file:./prisma/dev.db" → api-livros/prisma/dev.db
```

O `prisma db push` criou as tabelas no primeiro arquivo. O seed abriu o segundo (que estava vazio, sem tabelas). Resultado: `no such table`.

### O que o computador entendeu

O SQLite recebeu a query `DELETE FROM "Livro"`. Procurou a tabela no arquivo `prisma/dev.db` (que o adapter abriu). O arquivo existia (foi criado automaticamente pelo libsql), mas estava vazio — nunca recebeu um `CREATE TABLE`. O SQLite respondeu com o código de erro 1.

### Correção — alinhar os caminhos

Garantir que **todos** os lugares que referenciam o banco usem o mesmo caminho:

```typescript
// prisma.config.ts
url: "file:./dev.db"

// seed.ts
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });

// PrismaService (src/prisma/prisma.service.ts)
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
```

### Conceito: Caminhos relativos no Node.js

Caminhos relativos no Node.js são resolvidos a partir do **diretório de trabalho atual** (`process.cwd()`), não do arquivo que contém o código. Isso significa que `file:./dev.db` sempre aponta para `api-livros/dev.db` quando o processo Node é iniciado na raiz do projeto.

**Armadilha:** se você rodar `npm run start:dev` de `/workspaces/all_Projects_Alura/api-livros`, o `./dev.db` é `api-livros/dev.db`. Mas se rodar de `/workspaces/all_Projects_Alura/`, o `./dev.db` seria `all_Projects_Alura/dev.db` — um arquivo diferente.

### Boa prática: usar caminho absoluto ou env var

```typescript
// Com variável de ambiente (mais seguro)
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
```

---

## ERRO 8: `No seed command configured`

### O que aconteceu

Rodamos `npx prisma db seed` e o Prisma respondeu que nenhum comando de seed estava configurado, sugerindo adicionar ao `prisma.config.ts`.

### Por que é um erro — Prisma v7 moveu o seed de lugar

No Prisma v6 e anteriores, o seed era configurado no `package.json`:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

No Prisma v7, a configuração de seed (e todas as configurações de migração) foram movidas para o `prisma.config.ts`, o novo arquivo central de configuração introduzido no v7.

### Correção

```typescript
// prisma.config.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx ./prisma/seed.ts",  // ← seed config aqui
  },
  datasource: { url: "file:./dev.db" },
});
```

---

## ERRO 9: `moduleFormat: "esm"` quebra o Node — o conflito CJS/ESM

### O que aconteceu

Após adicionar `moduleFormat = "esm"` ao schema do Prisma e regenerar, o servidor NestJS quebrou com:
```
ReferenceError: exports is not defined in ES module scope
Object.defineProperty(exports, "__esModule", { value: true });
```

### Por que é um erro — a guerra dos módulos

Este é o erro mais complexo da sessão. Envolve três sistemas diferentes que precisam concordar sobre o formato de módulo:

1. **Prisma** gera o cliente (código que conecta ao banco)
2. **TypeScript/swc** compila o projeto NestJS
3. **Node.js** executa o código compilado

Cada um tem sua própria configuração de "formato de módulo" (CJS vs ESM), e elas precisam ser compatíveis.

#### O que são CJS e ESM?

**CJS (CommonJS):** o sistema de módulos original do Node.js. Usa `require()` para importar e `module.exports` para exportar. Síncrono, funciona com `require()` em qualquer lugar do código.

**ESM (ECMAScript Modules):** o sistema de módulos nativo do JavaScript moderno. Usa `import`/`export`. Assíncrono, só funciona no topo do arquivo.

#### O que `moduleFormat: "esm"` fez

Quando configuramos `moduleFormat = "esm"` no schema do Prisma, dissemos ao gerador: "gere o cliente Prisma como ESM". Mas o Prisma gerou código que, embora fosse nominalmente ESM, continha a linha:

```javascript
Object.defineProperty(exports, "__esModule", { value: true });
```

Esta linha é uma **ponte CJS→ESM**: ela diz ao Node "este módulo CJS pode ser importado como ESM". Mas se o Node já está tratando o arquivo como ESM, a variável `exports` não existe (em ESM, não existe `exports`, `module`, `require`, `__dirname`, `__filename`). Resultado: `ReferenceError`.

### O que o computador entendeu

1. O NestJS compilou o projeto (com swc) e copiou `generated/prisma/` para `dist/generated/` como assets
2. O Node.js carregou `dist/generated/prisma/client.js`
3. O arquivo tinha `moduleFormat: "esm"`, então o Node detectou que deveria ser ESM
4. Ao tentar executar como ESM, encontrou `Object.defineProperty(exports, ...)` → `exports` não existe em ESM → `ReferenceError`

### Correção — remover `moduleFormat`

A solução mais simples: deixar o Prisma no formato padrão (CJS), que é o que o NestJS espera:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
  // moduleFormat = "esm"  ← REMOVER
}
```

Depois: `npx prisma generate` para regenerar.

### Por que não insistir no ESM?

Migrar um projeto NestJS inteiro para ESM é possível, mas complexo:
- `package.json` precisa de `"type": "module"`
- Todos os imports precisam de extensão `.js`
- `__dirname` e `__filename` não existem (usar `import.meta.url`)
- O compilador swc do NestJS pode não funcionar corretamente
- Várias bibliotecas do ecossistema Node ainda são CJS-only

Para um projeto de aprendizado, CJS é a escolha pragmática.

---

## ERRO 10: `MODULE_NOT_FOUND: Cannot find module dist/main`

### O que aconteceu

Após corrigir o moduleFormat, o `nest build` rodou sem erros (0 erros de TypeScript), mas o `dist/` não continha nenhum arquivo `.js` — apenas a pasta `generated/` (assets do Prisma) e `tsconfig.build.tsbuildinfo`. O Node não encontrou `dist/main.js`.

### Por que é um erro — swc não compila com `module: "nodenext"`

O NestJS 11 usa o **compilador swc** por padrão (substituindo o `tsc` tradicional). O swc é muito mais rápido que o tsc, mas tem suporte limitado a configurações avançadas do TypeScript.

O `tsconfig.json` do projeto tinha:
```json
{ "module": "nodenext", "moduleResolution": "nodenext" }
```

O swc **não suporta** `module: "nodenext"`. Ele tentou compilar, não emitiu erros (porque a checagem de tipos é feita pelo `tsc` em paralelo, que reportou "0 errors"), mas o swc simplesmente **não gerou output** para os arquivos TypeScript.

### O que o computador entendeu

1. `nest build` chamou o swc para compilar `src/`
2. swc leu `tsconfig.json`, viu `module: "nodenext"`
3. swc não sabe lidar com `nodenext` → pulou a compilação dos `.ts` sem avisar
4. Só os assets do `nest-cli.json` foram copiados para `dist/generated/`
5. `nest start` tentou rodar `node dist/main.js` → arquivo não existe → erro

É um **silent failure**: o swc não emite erro, simplesmente não gera output.

### Diagnóstico

```bash
nest build && ls dist/
# Só mostra "generated" e "tsconfig.build.tsbuildinfo" — sem main.js
```

### Correção — usar `commonjs`

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",         // "nodenext" → "commonjs"
    "moduleResolution": "node"    // "nodenext" → "node"
  }
}
```

E remover `resolvePackageJsonExports` (ver Erro 11).

### Conceito: swc vs tsc

| | tsc (TypeScript) | swc (Speedy Web Compiler) |
|---|---|---|
| Velocidade | Lento (ms/arquivo) | Rápido (μs/arquivo) |
| Suporte TS | Completo | Subconjunto |
| Type checking | Sim | Não (delega ao tsc) |
| `module: "nodenext"` | ✅ Suporta | ❌ Não suporta |
| Uso no NestJS 11 | Opcional (`"builder": "tsc"`) | Padrão |

Se precisar de `nodenext` ou outras configurações avançadas, configure o builder no `nest-cli.json`:
```json
{ "compilerOptions": { "builder": "tsc" } }
```

---

## ERRO 11: `Option 'resolvePackageJsonExports' can only be used when moduleResolution is 'node16', 'nodenext', or 'bundler'`

### O que aconteceu

Após trocar `module` para `commonjs` e `moduleResolution` para `node`, o TypeScript reclamou que `resolvePackageJsonExports` não é compatível com `moduleResolution: "node"`.

### Por que é um erro — dependência entre opções do tsconfig

Certas opções do `tsconfig.json` têm dependências entre si. `resolvePackageJsonExports` diz ao TypeScript para respeitar o campo `exports` no `package.json` das dependências ao resolver imports. Mas isso só funciona com sistemas de módulo que entendem o campo `exports`: `node16`, `nodenext` e `bundler`.

`moduleResolution: "node"` (o sistema clássico) não entende o campo `exports` do `package.json` — ele usa o algoritmo de resolução antigo do Node.js (pastas `node_modules`, campo `main`, etc.).

### O que o computador entendeu

O TypeScript validou a combinação de opções do `compilerOptions`. Encontrou `resolvePackageJsonExports: true` com `moduleResolution: "node"`. A documentação interna do TS diz que essa combinação é inválida. Reportou TS5098.

### Correção

Remover `resolvePackageJsonExports` do `tsconfig.json`:
```json
// Remover esta linha:
"resolvePackageJsonExports": true,
```

### Lição

O `tsconfig.json` tem regras de compatibilidade entre opções. Quando mudar `module`/`moduleResolution`, verifique se outras opções dependentes também precisam mudar. O erro TS5098 é específico sobre isso.

---

## ERRO 12: TypeScript `rootDir` inference desloca a estrutura do `dist/`

### O que aconteceu (em uma tentativa anterior)

Em um momento da depuração, os arquivos compilados foram parar em `dist/src/main.js` em vez de `dist/main.js`. O NestJS procurava em `dist/main.js` e não encontrava.

### Por que é um erro — como o rootDir é inferido

O TypeScript infere `rootDir` (o diretório raiz dos fontes) a partir do **diretório base comum** de todos os arquivos incluídos na compilação.

Se todos os `.ts` estão em `src/`, `rootDir = "src"`. A estrutura de saída fica:
```
src/main.ts        → dist/main.js
src/mod-autor/...  → dist/mod-autor/...
```

Mas se houver um arquivo `.ts` fora de `src/`, como `prisma/seed.ts`, o TypeScript recalcula: o diretório comum agora é `.` (raiz do projeto). A estrutura de saída desloca:
```
src/main.ts        → dist/src/main.js     ← NestJS não acha aqui
prisma/seed.ts     → dist/prisma/seed.js
```

### Correção

Excluir `prisma/` do `tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules", "test", "dist", "**/*spec.ts",
    "src/generated",
    "prisma"           // ← impede rootDir de subir um nível
  ]
}
```

---

## ERRO 13: `Nest can't resolve dependencies of the ModAutorService`

### O que aconteceu

O servidor NestJS iniciou, mas ao tentar instanciar o `ModAutorService`, o container de injeção de dependência não encontrou o `PrismaService`:
```
UnknownDependenciesException: Nest can't resolve dependencies of the ModAutorService (?).
Please make sure that the argument PrismaService at index [0] is available in the ModAutorModule.
```

### Por que é um erro — modularidade no NestJS

No NestJS, cada módulo (`@Module`) tem seu próprio escopo de providers. Um serviço definido no `PrismaModule` só está disponível para outros módulos se:

1. O `PrismaModule` exporta o serviço (`exports: [PrismaService]`)
2. E o módulo consumidor importa o `PrismaModule` (`imports: [PrismaModule]`)

**OU** o `PrismaModule` é declarado como `@Global()`, tornando seus exports disponíveis em toda a aplicação sem import explícito.

Nosso `PrismaModule` tinha `exports: [PrismaService]` mas **não** tinha `@Global()`. O `ModAutorModule` não importava `PrismaModule`. Resultado: o container de DI do NestJS não encontrou `PrismaService` no escopo do `ModAutorModule`.

### O que o computador entendeu

O NestJS percorreu a árvore de módulos:
1. `AppModule` → imports `PrismaModule` e `ModAutorModule`
2. `ModAutorModule` → providers inclui `ModAutorService`
3. `ModAutorService` → constructor pede `PrismaService`
4. Container procura `PrismaService` no escopo de `ModAutorModule` → não encontrado
5. Container procura nos módulos pai → `PrismaModule` não é `@Global()`, seus exports não vazam
6. Resultado: `UnknownDependenciesException`

### Correção

```typescript
import { Global, Module } from '@nestjs/common';

@Global()  // ← exports disponíveis em toda a aplicação
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Conceito: `@Global()` vs imports explícitos

| Estratégia | Quando usar | Trade-off |
|-----------|-------------|-----------|
| `@Global()` | Serviços transversais (Prisma, Config, Logging) | Acoplamento implícito — qualquer módulo pode injetar |
| Import explícito | Serviços de domínio (ModAutorService) | Acoplamento explícito — mais verboso, mais claro |

Para `PrismaService`, `@Global()` é a prática recomendada porque ele é usado por praticamente todos os módulos.

---

## ERRO 14: `PartialType` exige segundo argumento no `@nestjs/mapped-types` v2+

### O que aconteceu

Ao usar `PartialType(CreateAutorDto)` para criar o `UpdateAutorDto`, o TypeScript reportou:
```
1 argumentos eram esperados, mas 0 foram obtidos.
Não foi fornecido um argumento para 'options'.
```

### Por que é um erro — breaking change no mapped-types

O pacote `@nestjs/mapped-types` v2 mudou a assinatura do `PartialType`: agora ele exige um segundo parâmetro (`options`), mesmo que seja um objeto vazio.

### Correção

```typescript
// v1 (quebra no v2+)
export class UpdateAutorDto extends PartialType(CreateAutorDto) {}

// v2+
export class UpdateAutorDto extends PartialType(CreateAutorDto, {}) {}
```

O `{}` é um objeto de opções vazio — você pode configurar comportamento do PartialType (ex: `skipNullProperties`), mas o mínimo é passar um objeto.

---

## ERRO 15: Internal server error (500) sem stack trace útil

### O que aconteceu

Ao testar `GET /autores/busca?nome=Machado`, o servidor respondeu:
```json
{"statusCode":500,"message":"Internal server error"}
```

Sem stack trace, sem detalhes.

### Por que é um erro — o caminho do banco no PrismaService

Após corrigir o seed (que usava `file:./dev.db`), o `PrismaService` ainda estava configurado com `file:./prisma/dev.db`. O servidor subia, mas ao receber a primeira requisição, tentava consultar um banco vazio (ou inexistente) e o Prisma lançava exceção interna.

Em produção, o NestJS omite stack traces por segurança. Em desenvolvimento, o erro 500 genérico geralmente indica:
- Conexão com banco falhou silenciosamente
- Tabela não encontrada
- Erro no adapter

### Diagnóstico

```bash
# Verificar se o caminho do banco está consistente
grep "dev.db" prisma.config.ts src/prisma/prisma.service.ts prisma/seed.ts
```

### Correção

Alinhar o PrismaService com o mesmo caminho dos outros:
```typescript
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
```

---

## Mapa de Causalidade

Vários destes erros estão conectados em cadeia:

```
module: "nodenext"
    │
    ├── ERRO 10: swc não compila (dist vazio)
    │       │
    │       └── Correção: module: "commonjs"
    │               │
    │               └── ERRO 11: resolvePackageJsonExports incompatível
    │
    ├── ERRO 9: moduleFormat: "esm" no Prisma
    │       │
    │       └── exports is not defined (CJS em contexto ESM)
    │
    └── ERRO 12: rootDir inference (prisma/seed.ts puxa rootDir pra cima)
```

E outra cadeia:

```
PrismaService sem @Global()
    │
    └── ERRO 13: UnknownDependenciesException

Caminhos do .db diferentes
    │
    ├── ERRO 7: SQLITE_ERROR (seed)
    └── ERRO 15: 500 Internal Server Error (runtime)
```

---

## Checklist de Prevenção para Novos Projetos

Ao iniciar um projeto NestJS + Prisma v7 + SQLite, verifique nesta ordem:

1. `tsconfig.json`: `module: "commonjs"`, `moduleResolution: "node"`
2. `tsconfig.build.json`: `exclude` inclui `prisma/`
3. `prisma/schema.prisma`: sem `moduleFormat`, `output` fora de `src/`
4. `prisma.config.ts`: `seed` configurado, `url: "file:./dev.db"`
5. `PrismaService`: `@Global()` no módulo, `adapter` no construtor, caminho do `.db` consistente
6. `PrismaClient`: sempre com `{ adapter }` no construtor
7. Seed: sem caracteres Unicode em comentários, caminho do `.db` consistente

---

## Stack de Compatibilidade Confirmada

| Componente | Status |
|-----------|--------|
| NestJS 11 + Prisma 7.9.1 + SQLite (libsql) | ✅ Funciona |
| `module: "commonjs"` + swc | ✅ Funciona |
| `module: "nodenext"` + swc | ❌ swc não compila |
| `moduleFormat: "esm"` (Prisma) + NestJS CJS | ❌ Conflito CJS/ESM |
| `@prisma/adapter-libsql` 7.9.1 | ✅ Funciona |

---

## Conceitos Transversais Aprendidos

### 1. A diferença entre "compila" e "funciona"

TypeScript reportando 0 erros não significa que o código vai rodar. O swc pode compilar silenciosamente sem gerar output (Erro 10), o Node pode rejeitar código CJS em contexto ESM (Erro 9), e o NestJS pode não encontrar dependências em runtime (Erro 13). A compilação é necessária, mas não suficiente.

### 2. Breaking changes em cascata

Três breaking changes do Prisma v7 nos afetaram:
- Driver adapter obrigatório (Erro 3)
- Seed config no `prisma.config.ts` (Erro 8)
- `moduleFormat` gerando CJS/ESM híbrido (Erro 9)

Cada um exigiu uma correção diferente, e eles interagiram entre si.

### 3. O ecossistema Node está em transição CJS→ESM

Vimos na prática a dor da transição: ferramentas diferentes (Prisma, NestJS, swc, tsx/esbuild) têm níveis diferentes de suporte a ESM. A escolha pragmática para projetos NestJS em 2026 ainda é CJS.
