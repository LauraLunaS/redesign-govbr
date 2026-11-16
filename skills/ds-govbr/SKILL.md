---
name: ds-govbr
description: Referência do Design System GOV.BR para redesenhar telas — cores, tipografia, grid, espaçamentos e o padrão de cada componente (header, footer, breadcrumb, tabela, filtros, paginação, formulário, mensagem, abas, botões, tags, wizard). Use ao decidir como uma tela deve ficar no padrão do governo federal.
---

# Design System GOV.BR: referência rápida

Fonte oficial: https://www.gov.br/ds. Na dúvida sobre um componente, consulte a página dele lá. Se a biblioteca oficial DS GOV.BR estiver ligada ao arquivo do Figma e o MCP do Figma estiver disponível, prefira instâncias dela. O kit deste plugin desenha camadas editáveis com as mesmas medidas e cores.

## Fundamentos

| Item | Valor |
|---|---|
| Fonte | **Rawline** (fallback: Raleway / sans-serif). Pesos 400, 600 e 700 |
| Texto base | 16 px (corpo); 14 px em tabelas e formulários densos; 12 px em legendas |
| Títulos | H1 32 px semibold · seção 20 px semibold · cartão 18 px semibold |
| Azul primário | `#1351B4` (ações, links, foco, aba ativa) |
| Azul escuro | `#071D41` (footer) |
| Texto | `#333333`; secundário `#555555`; placeholder `#888888` |
| Bordas | `#CCCCCC`; divisórias leves `#E6E6E6` |
| Fundos | página `#F8F8F8`; cartão `#FFFFFF`; cabeçalho de tabela `#F0F0F0`; seleção `#DBE8FB` |
| Feedback | sucesso `#168821`, erro `#E52207`, aviso `#FFCD07`, info `#1351B4` |
| Grid | 12 colunas, calha 24 px. Margens: 1280 → 40, 1440 → 120, 1920 → 160 |
| Espaçamento | múltiplos de 8 (8, 16, 24, 32, 40, 64) |
| Sombra de cartão | y 1, desfoque 6, preto 16% |
| Ícones | **Font Awesome 5 Free** (Solid; Regular para calendário e documento), o mesmo conjunto do DS GOV.BR. Tamanhos 12 a 20 px, cor do texto ou azul em ações |

## Componentes e padrões

- **Header:**
  - linha 1: logo gov.br, divisor, assinatura do órgão, links e "Entrar" (pílula primária) ou avatar com nome;
  - linha 2: ícone de menu, título do sistema e busca à direita;
  - menu horizontal, se o sistema tiver; o item ativo fica sublinhado em azul.
- **Footer:** fundo `#071D41`, logo branco, colunas de links em caixa alta, e licença ou texto institucional, só se existir.
- **Breadcrumb:** ícone de casa > links azuis > página atual em texto comum.
- **Botões:** pílula (raio 100).
  - **Primário:** azul cheio, um por área de ação.
  - **Secundário:** borda azul.
  - **Terciário:** só texto.
  - Altura 40 (normal) ou 32 (pequeno). Ícone à esquerda.
- **Tabela (padrão GOV.BR):**
  - cartão branco com sombra;
  - barra de título de 64 px: título, lupa e menu ⋮;
  - cabeçalho de 56 px, fundo `#F0F0F0`, títulos **azuis** com ícone de ordenar; coluna ordenada com fundo `#DBE8FB`;
  - linhas de 64 px, divisória `#CCCCCC`, texto 14 px truncado em 1 linha (2 no máximo);
  - seleção opcional com checkbox na 1ª coluna;
  - **paginação:** "Exibir [10 ▾] | 1–10 de N itens" e, à direita, "Página [1 ▾] | ‹ ›".
- **Busca e filtros:**
  - campo de busca com lupa visível acima da lista, até 400 px;
  - botão secundário **Filtros** com ícone de funil, à direita;
  - o botão abre o **painel de 317 px** com sombra: grupos "Filtrar por …" (radio = escolha única, checkbox = várias), divisória `#888888` entre grupos, e no rodapé o link **Limpar** e o botão primário **Aplicar**;
  - filtros aplicados viram tags azul-claras com × e o link "Limpar filtros".
- **Formulário:**
  - rótulo acima do campo, 14 px semibold; obrigatório com `*`;
  - campo de 40 px, borda `#888888`, raio 4;
  - ajuda em 12 px abaixo; erro com borda e mensagem vermelhas;
  - ações à direita, primária por último.
- **Mensagem:** faixa colorida com ícone (info, aviso, erro, sucesso), texto 14 px e título opcional em negrito.
- **Abas:** texto 16 px; a aba ativa fica azul, semibold e com sublinhado de 4 px. Contador em pílula.
- **Tag:** raio 4, 12 px semibold. Cores conforme o status: ok/verde, erro/vermelho, aviso/amarelo com texto escuro, info/azul, neutro/cinza.
- **Wizard (passos):** círculos numerados de 32 px. Passo atual e concluídos em azul, futuros com borda cinza.
- **Cartão:** branco, sombra, padding 24, título 18 semibold.
- **Painel lateral de detalhe:** 360 px, borda superior azul de 4 px, título e ações no rodapé.

## Acessibilidade (WCAG 2.1 AA, exigida pelo gov.br)

- **Contraste:** mínimo 4,5:1 no texto. O amarelo `#FFCD07` só com texto escuro.
- **Status:** nunca indicar status só por cor. Toda tag tem texto.
- **Foco:** foco visível e ordem de foco igual à ordem visual.
- **Áreas clicáveis:** mínimo de 44 × 44 px em mobile e 32 px em desktop denso.
- **Rótulos:** todo campo tem rótulo visível (placeholder não substitui rótulo).

## O que fica fora do DS (exceções aceitas)

- Mapas e diagramas.
- Gráficos de dados: seguem as cores do DS, mas a forma é livre.
- Fluxos muito específicos do sistema.

Registre essas exceções numa nota na própria tela (`mensagem` nível info) ou no `estado.json`.
