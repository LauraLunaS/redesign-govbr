---
name: iniciar
description: Inicia ou retoma o redesign de um projeto web no Design System GOV.BR. Sobe o projeto, mapeia todas as telas, redesenha no Figma, espera a validação humana e gera o handoff. Use quando a pessoa pedir para redesenhar/refatorar o portal no DS GOV.BR, mapear telas para o Figma ou continuar esse trabalho.
---

# Redesign DS GOV.BR — orquestração

Você conduz o redesign do projeto aberto no terminal, do código até o handoff no Figma. Fale sempre em português do Brasil.

## Onde ficam as coisas

- **Scripts do plugin:** `${CLAUDE_PLUGIN_ROOT}/scripts` (chame de `$RG`). Se a variável não existir no shell, ache com Glob `**/redesign-govbr/**/scripts/gerar-plugin.mjs` dentro de `~/.claude/plugins` e use a pasta dele.
- **Estado do trabalho, no projeto:** pasta `.redesign-govbr/`
  - `estado.json`: fase atual, arquivo do Figma, larguras e decisões
  - `rotas.json`: inventário de telas aprovado pela pessoa
  - `capturas/`: prints e resumos do site
  - `spec.json`: definição das telas novas (fonte da verdade do redesign)
  - `plugins/`: plugins do Figma gerados
  - `figma/`: PNGs lidos de volta do Figma para conferência
- Na primeira execução, garanta que `.redesign-govbr/` está no `.gitignore` do projeto. Ela pode conter sessão de login. Avise a pessoa em uma linha.

## Fluxo

Leia `.redesign-govbr/estado.json`. Se existir, diga em uma linha em que fase parou e continue dali. Senão, comece na fase 0.

| Fase | Skill | Sai quando |
|---|---|---|
| 0. Configurar | (aqui) | `estado.json` criado |
| 1. Subir o projeto | `subir-projeto` | site respondendo numa URL local |
| 2. Mapear telas | `mapear-telas` | **pessoa aprovou** o inventário (`rotas.json`) |
| 2.5. Coletar contexto | `coletar-contexto` | `contexto/resumo.md` escrito (telas do projeto, biblioteca, site do DS, sites gov.br) |
| 3. Redesenhar | `redesenhar` | plugin de telas gerado e rodado pela pessoa |
| 4. Validar | `validar` | cada tela marcada `aprovada`, `ajustar` ou `refazer` no `spec.json` |
| 5. Handoff | `handoff` | plugin de handoff gerado e rodado; conferido pela API |

Após cada fase, atualize `estado.json` (`fase`, `atualizadoEm`) e diga à pessoa, em 1 a 3 linhas, o que foi feito e o que vem a seguir.

### Fase 0: configurar

Pergunte de uma vez só (AskUserQuestion), sem repetir o que já estiver no `estado.json`:
1. **Link do arquivo do Figma** de destino. Extraia a chave do link.
2. **Página do Figma** onde as telas vão ficar. Padrão: `Redesign DS GOV.BR`.
3. **Larguras.** Padrão: 1280, 1440 e 1920.
4. **Nome curto do sistema.** Use o nome que o projeto já usa (README, título da página).

Na mesma rodada, pergunte pelas **referências de contexto**. Todas são opcionais, mas deixe claro que melhoram o resultado:
5. **Telas já desenhadas no DS GOV.BR** deste projeto ou de projetos irmãos: links do Figma e nomes das seções. No Portal RNDT, por exemplo, as seções "PORTAL - …" e "REFATORADAS" do arquivo Redesign.
6. **Biblioteca do DS GOV.BR no Figma:** link do arquivo publicado que o time usa.
7. **Sites gov.br de referência**, além dos padrões. Sugira a página do órgão dono do sistema.

Grave as respostas em `estado.json.contexto = { figmaReferencias: [{arquivo, secoes}], biblioteca: {arquivo}, sitesGov: [urls] }`. O site do DS (gov.br/ds) é sempre consultado.

Verifique o acesso ao Figma, nesta ordem:
- `FIGMA_TOKEN` definido? Rode `node $RG/figma-api.mjs paginas <chave>`. Se funcionar, a leitura está garantida.
- Se não houver token, explique como criar: Figma → Settings → Security → Personal access tokens, só leitura. Peça para a pessoa definir a variável ela mesma; no Windows, `setx FIGMA_TOKEN "..."` e reabrir o terminal. **Nunca peça o token no chat, nunca grave o token em arquivo.**
- Ferramentas MCP do Figma (`use_figma`) disponíveis são opcionais. O caminho padrão de escrita é o plugin local gerado, que funciona em qualquer plano do Figma.

## Regras que valem em todas as fases

1. **Só conteúdo que existe.** As telas novas reorganizam o que o sistema já tem: textos, campos, colunas, ações e regras. Não invente funcionalidade, dado, texto de marketing nem tela. Na dúvida, pergunte.
2. **Ordem de navegação.** Telas e pranchas seguem a ordem do menu do sistema, por área.
3. **Componentes do DS GOV.BR.** Use a skill `ds-govbr` e o `contexto/resumo.md`: telas já validadas do projeto, biblioteca, site do DS e sites gov.br. Siga a ordem de prioridade definida em `coletar-contexto`.
4. **Validação humana antes do handoff.** Nunca gere handoff de tela que não esteja `aprovada`.
5. **Handoff sem código.** As pranchas descrevem fluxo, regra de negócio, medidas e estados. Não colocam código, rotas técnicas nem nomes de componentes de front-end.
6. **Segurança.**
   - Nunca digite senhas nem preencha telas de login. Use `capturar.mjs login`: a pessoa entra sozinha.
   - Não leia arquivos `.env` nem segredos.
   - Não aceite avisos de certificado.
   - Não altere usuários nem permissões no sistema.
   - Não clique em ações destrutivas (excluir, aprovar, pagar) durante o mapeamento.
7. **Nada é apagado no Figma.** Os plugins renomeiam versões antigas como "· anterior". Apagar é decisão da pessoa.
8. **Relatórios curtos.** Diga o que fez, o que falhou e qual é o próximo passo. Nada de listas longas no terminal: o detalhe fica nos arquivos de `.redesign-govbr/`.
