---
name: validar
description: Confere no Figma (pela API REST) as telas desenhadas e conduz a validação humana tela a tela, registrando aprovada/ajustar/refazer no spec. Fase 4 do redesign DS GOV.BR.
---

# Validar

## 1. Conferir que as telas chegaram

```
node $RG/figma-api.mjs secoes <chave> --pagina "<página>" --filtro "<Projeto> · <Área>"
```

Compare com o `spec.json`: deve haver uma tela por tela × largura, com os nomes `<Projeto> – <Área> · <ordem> · <nome> · <largura>`. Se faltar alguma, veja a mensagem que a pessoa colou: o plugin lista as falhas. Corrija o spec e gere de novo só essas telas, com `--telas`.

## 2. Olhar as telas

Exporte as telas da área em 1440 (`--escala 0.5`) e abra cada uma com Read:
```
node $RG/figma-api.mjs png <chave> <id1,id2,...> --saida .redesign-govbr/figma
```

Antes de mostrar à pessoa, verifique:
- texto cortado ou sobreposto;
- tabela estourando o cartão;
- painel cobrindo conteúdo importante;
- conteúdo diferente da captura original (texto inventado ou faltando).

Corrija o que for problema seu antes da validação humana.

## 3. Validação humana (obrigatória)

Pergunte com AskUserQuestion, em lotes de até 4 telas por pergunta. Para cada tela, as opções são:
- **Aprovada**
- **Ajustar** (a pessoa diz o quê, em "Outro")
- **Refazer**

Lembre que ela pode abrir o Figma para olhar com calma.

Registre no `spec.json`:
- `status`: `aprovada`, `ajustar` ou `refazer`;
- `ajustes`: o texto que a pessoa escreveu.

Para `ajustar` e `refazer`, volte à skill `redesenhar` só com essas telas (`--telas`) e repita esta validação. Quando toda a área estiver `aprovada`, siga para `handoff`.

Não marque nada como aprovado por conta própria.
