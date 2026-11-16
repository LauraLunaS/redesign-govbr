---
name: coletar-contexto
description: Reúne as referências que orientam o redesign DS GOV.BR — telas já desenhadas do projeto no Figma, a biblioteca do DS no Figma, a documentação oficial do DS no site gov.br/ds e páginas reais de sites do domínio gov.br — e resume os padrões em .redesign-govbr/contexto/resumo.md. Fase 2.5, antes de redesenhar.
---

# Coletar contexto

Tudo vai para `.redesign-govbr/contexto/`. Faça uma vez por projeto e atualize quando as referências mudarem. A saída principal é **`resumo.md`**: as skills `redesenhar` e `validar` e o subagente `redator-de-spec` leem esse arquivo antes de cada tela.

As fontes vêm do `estado.json` (`contexto`), preenchido na fase 0. Se alguma estiver vazia, pergunte uma vez. A pessoa pode dizer que não tem.

## 1. Telas já desenhadas do projeto (Figma)

São telas que o time já fez ou validou no DS GOV.BR. No Portal RNDT, por exemplo, as seções "PORTAL - …" e "REFATORADAS" do arquivo Redesign.

1. Liste as seções e telas de cada arquivo:
   ```
   node $RG/figma-api.mjs secoes <arquivo> --filtro "<parte do nome>"
   ```
2. Escolha de 6 a 10 telas representativas: lista com tabela e filtros, formulário, detalhe, painel ou dashboard, e estado vazio ou erro. Prefira as de 1440.
3. Exporte as imagens e abra cada uma com Read:
   ```
   node $RG/figma-api.mjs png <arquivo> <ids> --saida .redesign-govbr/contexto/figma
   ```
4. Extraia os números reais (fontes, cores, raios, espaçamentos, grid e blocos):
   ```
   node $RG/figma-api.mjs padroes <arquivo> <ids> > .redesign-govbr/contexto/padroes-figma.json
   ```

## 2. Biblioteca do DS GOV.BR no Figma

1. Peça o link do arquivo da biblioteca que o time usa: o kit oficial ou a cópia publicada na equipe.
2. Liste o que existe nela:
   ```
   node $RG/figma-api.mjs biblioteca <arquivo> --saida .redesign-govbr/contexto/biblioteca.json
   ```
   - Se der erro 403, o token precisa também do escopo **"Read components and styles published from individual files"**. Peça para a pessoa gerar outro token com esse escopo.
   - Se vier vazio, a biblioteca não está publicada.
3. Monte o mapa `biblioteca.componentes` no `spec.json`, com o papel e a key do componente ou conjunto. Para conjuntos, inclua a `variante` exata. Papéis aceitos pelo renderizador:
   - `header` e `footer`;
   - `botao-primario`, `botao-secundario` e `botao-terciario`, com `-pequeno` opcional.

   Com o mapa, o plugin usa **instâncias reais** desses componentes. Os outros componentes ficam desenhados no kit, com as medidas do DS.
4. Só funciona se a biblioteca estiver **ativada no arquivo de destino** (Assets → Libraries). Avise a pessoa.

## 3. Documentação oficial: https://www.gov.br/ds

Para cada componente que as telas vão usar, leia a página dele com WebFetch:
- **Endereço:** `https://www.gov.br/ds/components/<componente>?tab=designer`. Se não abrir, use `?tab=desenvolvedor` ou a busca do site.
- **Componentes mais comuns:** `header`, `footer`, `breadcrumb`, `button`, `input`, `select`, `checkbox`, `radio`, `textarea`, `table`, `pagination`, `tab`, `tag`, `message`, `card`, `list`, `wizard`, `collapse`, `upload`, `menu`, `modal`, `item`, `datetimepicker`.
- **Fundamentos:** `https://www.gov.br/ds/fundamentos-visuais/` (cores, tipografia, grid, espaçamento, ícones) e `https://www.gov.br/ds/padroes/` (formulários, filtros, tabelas).

Anote em `contexto/ds-web.md`, por componente:
- anatomia;
- variações;
- estados (hover, foco, desabilitado, erro);
- medidas;
- regras de uso, incluindo o que fazer e o que não fazer;
- acessibilidade.

Seja curto: só o que muda decisões de tela.

## 4. Sites do domínio gov.br

Capture páginas reais com composições parecidas com as do sistema (lista, busca, formulário, serviço, painel):
```
node $RG/capturar.mjs referencias --urls https://www.gov.br/pt-br,https://www.gov.br/pt-br/servicos,https://dados.gov.br/home --larguras 1440
```
- **Só endereços `*.gov.br`:** o script recusa qualquer outro domínio.
- **Comportamento:** não faz login e não clica em nada.
- **Sugestões:** portal gov.br, catálogo de serviços, dados.gov.br e a página do órgão dono do sistema (no RNDT, `https://www.gov.br/transportes`). A pessoa pode indicar outras.

Abra os PNGs e os `.json` (cabeçalho, menu, busca, filtros, tabelas) e anote os padrões de composição.

## 5. Resumo: `contexto/resumo.md` (obrigatório)

Até cerca de 150 linhas, com:
- **Fontes usadas:** arquivos, seções, URLs e data.
- **Padrões do projeto:** o que as telas já validadas fazem, como header e menu, largura de conteúdo, tabela, filtros, painel lateral, tamanhos de título e espaçamentos (de `padroes-figma.json`). Inclua as **exceções aceitas** pelo time.
- **Biblioteca:** os papéis mapeados e o que ficou no kit, com o motivo.
- **Regras do DS:** por componente usado, os pontos que o redesign deve seguir.
- **Referências gov.br:** padrões de composição observados e em que tipo de tela usar cada um.
- **Conflitos e decisões:** onde as fontes divergem e o que vale.

### Ordem de prioridade quando as fontes divergirem

1. **Regras do DS** (site e biblioteca) para a anatomia, os estados e a acessibilidade de cada componente.
2. **Telas já validadas do projeto** para composição, layout e exceções aceitas. A consistência com o que o time já aprovou vale mais que uma preferência nova.
3. **Sites gov.br** para composição de página quando o projeto ainda não tem precedente.
4. **Kit embutido** como último recurso.

Se uma tela validada do projeto contradiz uma regra do DS e não está registrada como exceção, **pergunte** antes de seguir um dos lados.

Mostre à pessoa um resumo de 5 linhas do `resumo.md` e siga para `redesenhar`.
