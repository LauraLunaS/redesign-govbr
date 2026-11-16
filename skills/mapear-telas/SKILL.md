---
name: mapear-telas
description: Mapeia todas as telas do site (rotas do código + navegação real), captura prints em cada largura e monta o inventário para a pessoa aprovar. Fase 2 do redesign DS GOV.BR.
---

# Mapear telas

## 1. Inventário pelo código, que é a fonte principal

Procure o roteador: `react-router` (`<Route`, `createBrowserRouter`), Next (`app/`, `pages/`), Vue Router, Angular (`Routes`) ou equivalentes. Para cada rota, anote:
- `id`: curto, sem acento
- `rota`
- `area`: a seção do menu
- `nome`: como aparece no menu ou no título
- `perfil`: papel exigido, vindo dos guards ou de `requiredRoles`
- `ordem`: posição no menu

Também anote **estados que são telas diferentes**: vazio, erro, sucesso, modal e etapas de wizard. Entram como telas próprias só se tiverem conteúdo próprio.

Use o subagente `mapeador-de-telas` quando houver muitas áreas. Ele devolve o inventário de uma área por vez.

## 2. Conferir navegando

- Instale as dependências dos scripts uma vez: `npm install --prefix "$RG"` e `npx --prefix "$RG" playwright install chromium`.
- Áreas logadas: rode `node $RG/capturar.mjs login --base <url>` e peça à pessoa que entre com o próprio usuário. Você nunca digita credenciais. Repita por perfil, se precisar, usando `--estado .redesign-govbr/auth-<perfil>.json`.
- Opcional: `node $RG/capturar.mjs descobrir --base <url>` encontra rotas alcançáveis por links que o código não deixou claras.

## 3. Aprovação do inventário (obrigatória)

Grave `.redesign-govbr/rotas.json` (lista de `{id, rota, area, nome, perfil, ordem, estado?}`). Mostre um resumo por área, em tabela curta, com a contagem de telas, e pergunte:
- se alguma tela deve sair, como as de teste, legado ou admin interno;
- se falta alguma tela.

Só siga com o inventário aprovado. Registre `inventarioAprovado: true` no `estado.json`.

## 4. Capturar

Rode `node $RG/capturar.mjs telas --base <url> --rotas .redesign-govbr/rotas.json --larguras <larguras> [--estado ...]`. Use um arquivo de rotas por perfil, se as sessões forem diferentes.

Depois da captura:
- Confira `redirecionadas`. Rota que caiu no login ou noutra página = sessão faltando. Peça o login daquele perfil e capture de novo só essas.
- Confira `erros`.
- Abra alguns PNGs com Read para checar se a captura está boa (tela carregada, sem spinner).

O resultado fica em `.redesign-govbr/capturas/`: `<id>-<largura>.png` e `<id>.json`, o resumo com títulos, campos, colunas, botões e mensagens. Esse resumo é a base do conteúdo na fase seguinte.
