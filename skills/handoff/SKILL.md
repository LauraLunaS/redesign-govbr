---
name: handoff
description: Gera o handoff (modelo 03 DEV) das telas aprovadas no Figma — telas limpas, pranchas anotadas com medidas, tipografia, grid, interações e regras de negócio, e os componentes de filtro. Fase 5 do redesign DS GOV.BR.
---

# Handoff

Só entram telas com `status: "aprovada"` no `spec.json`.

## 1. Revisar as regras

As anotações laranjas das pranchas vêm do campo `regras` de cada tela. Antes de gerar, confira se cada tela aprovada tem as regras principais:
- o que cada ação faz e para onde leva;
- validações e campos obrigatórios;
- estados (vazio, erro, desabilitado);
- quem pode ver ou agir (perfil), em linguagem de negócio.

**Sem código, rotas técnicas ou nomes de componentes de front-end.** `alvo` é um texto que aparece na tela (ou `/regex/`); a nota usa `**negrito**` no termo principal.

Notas comuns já entram sozinhas: Filtros, Exibir, contagem de itens, Página e Limpar filtros.

## 2. Gerar

```
node $RG/gerar-plugin.mjs handoff --spec .redesign-govbr/spec.json --area "<Área>"
```

O plugin monta, na página das telas, o quadro `HANDOFF · <Projeto> · <Área>` com:
- **uma faixa por largura ("Media Query"):** telas limpas à esquerda e pranchas anotadas à direita;
- **"Componentes de filtro":** busca + botão Filtros, painel aberto, filtros aplicados, cabeçalho da tabela e paginação, com medidas e comportamento.

Se rodar de novo, o quadro anterior vira "· versão anterior".

## 3. A pessoa roda o plugin

Igual à fase de telas: Import plugin from manifest → `.redesign-govbr/plugins/handoff-<área>/manifest.json` → rodar.

## 4. Conferir e fechar

- Use `figma-api.mjs secoes`, sem filtro, para achar o quadro `HANDOFF · …` e exportar um PNG dele.
- Confira que as pranchas apareceram e que a mensagem não lista "Telas não encontradas".
- Marque as telas como `status: "handoff"` e atualize `estado.json`.
- Diga à pessoa o que foi entregue e quais áreas ainda faltam.
