BFF em JavaScript puro (ESM)

- Para rodar em desenvolvimento:
  npm install
  npm run dev

- Para rodar em produção:
  npm start

Auth local (seguro para repositorio publico):

- Nao coloque credenciais em codigo.
- Copie `server/.env.local.example` para `server/.env.local`.
- Preencha apenas localmente:
  - `BFF_DEV_AUTH_ENABLED=true`
  - opcao 1: `BFF_DEV_AUTH_BEARER_TOKEN`
  - opcao 2: `BFF_DEV_AUTH_USERNAME` e `BFF_DEV_AUTH_PASSWORD`
- O arquivo `.env.local` nao deve ser versionado (`*.local` ja esta no `.gitignore`).

Estrutura:

- src/config/env.js: configuração de ambiente
- src/app.js: configuração do express
- src/index.js: entrypoint
- src/routes.js: rotas principais
- src/modules/customers/: módulo de clientes (controller e service)

Necessário Node.js 18+.
