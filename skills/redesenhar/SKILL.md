---
name: redesenhar
description: Redesenha as telas mapeadas no Design System GOV.BR direto no Figma. Escreve o spec.json de cada área a partir das capturas e do código, gera o plugin do Figma e guia a pessoa para rodá-lo. Fase 3 do redesign DS GOV.BR.
---

# Redesenhar no DS GOV.BR

Antes de começar, carregue a skill `ds-govbr` (padrões e componentes). O formato completo do spec está em [spec.md](spec.md).

## 1. Escrever o spec, uma área por vez

Para cada área do `rotas.json`, na ordem do menu:
1. Leia `capturas/<id>.json` e veja `capturas/<id>-1440.png` com Read.
2. Leia o componente da página no código. Ali estão os textos exatos, as validações, os estados (vazio, erro, carregando), as permissões e as regras.
3. Escreva as telas em `.redesign-govbr/spec.json`, campo `telas`, com `status: "desenhada"`:
   - **conteúdo idêntico ao sistema:** títulos, rótulos, colunas, opções, botões e mensagens;
   - **estrutura no padrão DS GOV.BR:** escolha os blocos certos em [spec.md](spec.md);
   - **`regras`:** o comportamento e as regras de negócio tirados do código, uma nota por elemento (`alvo` = texto que aparece na tela). Elas viram as anotações do handoff.

   Com muitas áreas, delegue cada uma ao subagente `redator-de-spec`. Revise o que voltar contra a regra "só conteúdo que existe".
4. Preencha os dados do topo do spec uma vez, a partir do sistema real: `projeto`, `figma`, `larguras`, `cabecalho` (assinatura, nome do sistema, itens do menu, usuário de exemplo) e `rodape`.

## 2. Gerar o plugin

```
node $RG/gerar-plugin.mjs telas --spec .redesign-govbr/spec.json --area "<Área>"
```
- Sem `--area`, gera tudo de uma vez. Por área é melhor: a revisão fica menor.
- `--telas id1,id2` refaz só algumas telas, por exemplo as marcadas `ajustar`.
- O gerador valida o spec. Se acusar erro, corrija e gere de novo.

## 3. A pessoa roda o plugin (1 clique)

Explique em até 4 linhas:
1. Abrir o arquivo do Figma no **Figma desktop**.
2. Ir em **Plugins → Development → Import plugin from manifest…** e escolher `.redesign-govbr/plugins/telas-<área>/manifest.json` (caminho completo). A importação é feita só na primeira vez de cada plugin.
3. Rodar o plugin e esperar a mensagem final.
4. Avisar com "rodei" ou colar a mensagem.

O plugin cria uma seção por área e largura, `<Projeto> · <Área> (DS GOV.BR · <largura>)`, com as telas em ordem. Se a tela já existir, a nova entra no lugar e a antiga desce com o sufixo "· anterior". Nada é apagado.

**Alternativa sem clique:** se as ferramentas MCP do Figma estiverem disponíveis e com cota, você pode executar o mesmo `code.js` via `use_figma`. Remova a última linha (`main().then(...)`) e devolva `await main()`. Se o arquivo passar de 50 mil caracteres, gere por área ou por tela.

## 4. Conferir

Siga para a skill `validar`.
