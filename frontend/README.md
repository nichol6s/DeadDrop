# DeadDrop — Frontend

Interface em português para criar e revelar segredos de uso único. A cifragem e a decifragem ocorrem no navegador com AES-256-GCM. A chave fica no fragmento `#` do link; a API recebe o conteúdo cifrado e o IV.

## Tecnologias e estrutura

Next.js 16.4.3, React 19.3, TypeScript 5 e Tailwind CSS 4, com base gerada pelo `create-next-app`.

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/page.tsx` | Criação do segredo e geração do link |
| `src/app/secret/[id]/page.tsx` | Confirmação de leitura e decifragem |
| `src/app/layout.tsx` e `globals.css` | Estrutura visual e estilos globais |
| `src/lib/crypto.ts` | Operações criptográficas utilizadas pelas páginas |
| `src/lib/crypto.test.mjs` | Testes sobre o módulo TypeScript |
| `next.config.ts` e `eslint.config.mjs` | Configuração do Next.js e lint |

## Pré-requisitos

- Node.js 24+ e npm.
- Backend em `http://localhost:8080`, conectado ao Redis, para criar e resgatar segredos.

É possível iniciar a interface e executar seus testes unitários sem os outros serviços. O fluxo completo exige API e Redis disponíveis.

## Executar em desenvolvimento

A partir da raiz do repositório, no PowerShell:

```powershell
cd frontend
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm ci
npm run dev
```

Copie o arquivo de exemplo somente na configuração inicial, preservando ajustes de um `.env.local` existente. Em Linux/macOS, use `cp .env.example .env.local`.

Acesse `http://localhost:3000`. Para encerrar, pressione `Ctrl+C` no terminal.

## Configuração

Em `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Essa URL precisa ser acessível pelo navegador. Variáveis `NEXT_PUBLIC_*` são públicas e não devem conter credenciais. Reinicie o servidor de desenvolvimento após alterações; em produção, gere um novo build para aplicar o endereço da API.

## Comandos

Execute os comandos dentro de `frontend/`:

| Comando | Finalidade |
| --- | --- |
| `npm ci` | Instalar as versões registradas no lockfile |
| `npm run dev` | Iniciar desenvolvimento com atualização automática |
| `npm run lint` | Executar ESLint sem aceitar avisos |
| `npm run typecheck` | Gerar tipos de rotas e verificar TypeScript |
| `npm test` | Testar texto Unicode/multilinha e rejeição de adulteração |
| `npm run build` | Gerar o build de produção |
| `npm start` | Servir um build já gerado na porta 3000 |

Para verificar o modo de produção, encerre o servidor de desenvolvimento e execute `npm run build`, seguido de `npm start`.

## Validação integrada

Siga o [guia de testes completos](../docs/testing.md) para iniciar os serviços, criar um segredo, conferir a chave no fragmento e verificar a leitura única. Veja também o [README do backend](../backend/README.md) e o [registro da configuração](../docs/project-setup.md).
