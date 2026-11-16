---
name: subir-projeto
description: Descobre como rodar o projeto web aberto (instala dependências, escolhe modo sem backend quando houver) e deixa o site respondendo numa URL local. Fase 1 do redesign DS GOV.BR.
---

# Subir o projeto

Objetivo: o site rodando localmente, para mapear as telas. Não altere código do projeto para isso, a não ser que a pessoa autorize.

1. **Ler antes de rodar.** Leia README, CONTRIBUTING, `package.json` (scripts), `docker-compose*`, `Makefile`, `.nvmrc` e `.env.example`. Não leia `.env` real nem segredos.
2. **Escolher o modo.** Prefira um modo que dispense backend: mock, fixtures ou variável como `VITE_USE_MOCK_API=true`. Procure por `mock` no README, no `vite.config` ou em `src/services`. Se só houver modo com backend real, pergunte à pessoa qual ambiente usar.
3. **Instalar.** Use `npm ci` se houver lockfile; senão, o gerenciador do lockfile (pnpm, yarn). Respeite a versão do Node indicada.
4. **Subir em segundo plano.** Rode o script de dev (`npm run dev` ou equivalente) com `run_in_background` e leia a saída até achar a URL local.
5. **Conferir.** Faça um `curl` na URL e confira que responde HTML. Se houver erro de compilação, leia, explique e proponha a correção mínima, aplicando só com autorização.
6. **Registrar** em `.redesign-govbr/estado.json`: `url`, `comando`, `modo` (mock ou real) e `perfis` disponíveis no modo mock, se houver.

Se o projeto não for web, ou não subir depois de duas tentativas razoáveis, pare e explique o que falta. Não force.
