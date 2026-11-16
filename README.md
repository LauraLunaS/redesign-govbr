# redesign-govbr

Plugin do **Claude Code** que redesenha um sistema web no **Design System GOV.BR**, direto no Figma.

Ele faz o seguinte, em ordem:
1. Sobe o projeto aberto no terminal.
2. Mapeia todas as telas.
3. Desenha cada uma no padrão do governo federal, com camadas editáveis.
4. Espera a validação de uma pessoa.
5. Gera o handoff para o time de desenvolvimento.

```
Projeto (VS Code) ──► sobe o site ──► mapeia telas ──► ⏸ você aprova o inventário
      ──► desenha no Figma ──► ⏸ você valida tela a tela ──► handoff (03 DEV)
```

**Não precisa de Figma pago.** O plugin lê o Figma pela API REST, com um token pessoal gratuito, e escreve por meio de um **plugin local** que ele mesmo gera. Você só clica em "Run" no Figma desktop. Se você tiver o MCP do Figma com cota, ele também pode escrever direto.

---

## 1. Preparar a máquina (uma vez)

| O quê | Como |
|---|---|
| Claude Code | `npm install -g @anthropic-ai/claude-code`, depois `claude` para entrar |
| Node 18+ | https://nodejs.org |
| Figma desktop | https://www.figma.com/downloads (o plugin local roda nele) |
| Token do Figma (gratuito, só leitura) | Figma → **Settings → Security → Personal access tokens** → criar com escopo de leitura de arquivos |
| Guardar o token | Windows: `setx FIGMA_TOKEN "seu-token"` e reabrir o terminal · macOS/Linux: `export FIGMA_TOKEN=...` no `~/.zshrc` ou `~/.bashrc` |

> O token fica só na sua variável de ambiente. Nunca cole o token no chat nem em arquivos do projeto.

## 2. Instalar o plugin

No terminal do VS Code, dentro de qualquer projeto:

```
claude
/plugin marketplace add <usuario>/redesign-govbr
/plugin install redesign-govbr@redesign-govbr
```

Troque `<usuario>/redesign-govbr` pelo endereço deste repositório no GitHub. Para atualizar depois: `/plugin marketplace update redesign-govbr`.

## 3. Usar num projeto

```
/redesign-govbr:iniciar
```

O agente pergunta:
- o link do arquivo do Figma;
- a página de destino;
- as larguras (padrão 1280, 1440 e 1920);
- o nome do sistema.

Depois segue sozinho e para nos pontos em que precisa de você:

| Etapa | Quem |
|---|---|
| Descobrir como rodar, instalar e subir o site (usa modo mock se houver) | agente |
| Mapear rotas pelo código e navegar com o Playwright | agente |
| Login nas áreas restritas: abre um navegador e **você** entra; ele nunca digita senha | você |
| **Aprovar o inventário de telas** | você |
| Escrever o spec das telas (só com conteúdo que já existe) e gerar o plugin do Figma | agente |
| Rodar o plugin no Figma desktop (*Plugins → Development → Import plugin from manifest* → Run) | você |
| Conferir as telas pela API e corrigir problemas visuais | agente |
| **Validar cada tela** (aprovada, ajustar ou refazer) | você |
| Gerar o plugin de handoff das telas aprovadas | agente |
| Rodar o plugin de handoff | você |

Outros comandos:
- `/redesign-govbr:status`: em que fase está e quantas telas há em cada situação.
- Você pode fechar o terminal a qualquer momento. O progresso fica em `.redesign-govbr/` no projeto e `/redesign-govbr:iniciar` continua de onde parou.

## 4. O que é gerado no Figma

- **Telas:** uma seção por área e largura, `Projeto · Área (DS GOV.BR · 1440)`, com as telas em ordem de menu.
  - Partes: header e footer GOV.BR, breadcrumb, título, abas, mensagens, indicadores, busca + Filtros (painel de 317 px), tabela no padrão GOV.BR (cabeçalho #F0F0F0 com títulos azuis, linhas de 64 px, paginação "Exibir | Página"), formulários, cartões, passos, painel lateral etc.
  - Tudo em auto layout, com camadas editáveis.
- **Handoff:** quadro `HANDOFF · Projeto · Área` no modelo 03 DEV.
  - Telas limpas e pranchas anotadas por largura: cotas em px, grid, tipografia, interações e regras de negócio.
  - Bloco **Componentes de filtro**.
- **Nada é apagado.** Versões antigas ficam com o sufixo "· anterior" ou "· versão anterior".

## 5. Estrutura do repositório

```
.claude-plugin/       plugin.json e marketplace.json
.mcp.json             Playwright MCP (navegação assistida)
skills/
  iniciar/            orquestra as fases e guarda o estado
  subir-projeto/      fase 1
  mapear-telas/       fase 2
  redesenhar/         fase 3 (+ spec.md: formato das telas)
  validar/            fase 4
  handoff/            fase 5
  ds-govbr/           referência do Design System GOV.BR
  status/             progresso
agents/               subagentes: mapeador-de-telas, redator-de-spec
scripts/
  capturar.mjs        Playwright: login manual, descoberta de rotas, prints + resumo do conteúdo
  figma-api.mjs       leitura do Figma pela API REST (páginas, seções, textos, PNG)
  gerar-plugin.mjs    spec.json → plugin do Figma (telas ou handoff)
  figma-kit/          kit DS GOV.BR, renderizador de telas e prancha de handoff
exemplos/spec.exemplo.json
```

Teste rápido do gerador, sem projeto nenhum:
```
node scripts/gerar-plugin.mjs telas --spec exemplos/spec.exemplo.json --saida /tmp/teste-telas
```
Depois importe `/tmp/teste-telas/manifest.json` no Figma desktop e rode.

## 6. Regras do agente

- **Só conteúdo que existe:** reorganiza o que o sistema já tem e não inventa funcionalidades nem textos.
- **Validação humana obrigatória** antes do handoff.
- **Handoff sem código:** fluxo, regras de negócio, medidas e estados.
- **Segurança:**
  - não digita senhas;
  - não lê `.env`;
  - não aceita avisos de certificado;
  - não executa ações destrutivas no sistema durante o mapeamento;
  - não versiona a sessão de login (`.redesign-govbr/` vai para o `.gitignore`).

## 7. Limitações conhecidas

- O plugin local precisa do **Figma desktop**: no navegador não dá para importar plugins de desenvolvimento.
- As telas usam camadas desenhadas com as medidas do DS GOV.BR, não instâncias da biblioteca oficial. Se a biblioteca estiver no arquivo e o MCP do Figma tiver cota, o agente pode trocar por instâncias.
- Projetos que não sobem localmente (dependem de VPN, backend fechado etc.): o agente pede ajuda ou trabalha a partir de prints que você fornecer.
- Fontes: usa **Rawline** se estiver instalada; senão, Inter.
