# Formato do `spec.json`

Exemplo completo: `exemplos/spec.exemplo.json` na raiz do plugin.

```jsonc
{
  "projeto": "Portal X",                 // nome curto; aparece nos nomes das seções e telas
  "figma": { "arquivo": "<chave>", "pagina": "Redesign DS GOV.BR" },
  "larguras": [1280, 1440, 1920],
  "grid": { "1280": { "margem": 40 }, "1440": { "margem": 120 }, "1920": { "margem": 160 } }, // opcional
  "cabecalho": {
    "assinatura": "Ministério …",        // texto ao lado do logo gov.br (se o sistema tiver)
    "sistema": "Portal X",               // título do sistema
    "busca": "O que você procura?",      // placeholder da busca do header (omita se não houver)
    "usuario": "Maria Silva",            // logado; omita para mostrar o botão "Entrar"
    "links": ["Ajuda"],                  // links do topo
    "menu": ["Início", { "nome": "Dados", "submenu": true }]  // menu principal, na ordem do sistema
  },
  "rodape": { "colunas": [{ "titulo": "…", "links": ["…"] }], "texto": "…" },
  "biblioteca": {                        // opcional: instâncias da biblioteca DS GOV.BR publicada (ver coletar-contexto)
    "componentes": {
      "header": "<key do componente>",
      "footer": "<key>",
      "botao-primario":   { "key": "<key do conjunto>", "variante": "<nome exato da variante>" },
      "botao-secundario": { "key": "<key do conjunto>", "variante": "…" },
      "botao-primario-pequeno": { "key": "…", "variante": "…" }
    },
    "textos": { "header": { "<nome da camada de texto>": "Portal X" } }  // textos a trocar dentro das instâncias
  },
  "telas": [ /* ver abaixo */ ]
}
```

Os papéis com instância da biblioteca são `header`, `footer`, `botao-primario`, `botao-secundario` e `botao-terciario`, com `-pequeno` opcional. Os demais componentes são desenhados pelo kit com as medidas do DS. Se a importação falhar porque a biblioteca não está publicada ou ativada, o plugin usa o kit e avisa na mensagem final.

## Tela

| Campo | Obrigatório | Uso |
|---|---|---|
| `id` | sim | único, sem acento |
| `area` | sim | seção do menu; agrupa as telas no Figma (não use `·`) |
| `ordem` | sim | posição dentro da área (1, 2, 3…) |
| `nome` | sim | nome da tela no Figma e na prancha (não use `·`) |
| `rota`, `perfil` | não | rastreabilidade; não aparecem na tela |
| `menu` | não | item do menu principal destacado como ativo |
| `status` | sim | `desenhada` → `aprovada` / `ajustar` / `refazer` → `handoff` |
| `ajustes` | não | o que a pessoa pediu na validação |
| `breadcrumb` | não | `["Início", "Área", "Tela"]` |
| `titulo`, `descricao` | não | título da página (H1) e texto de apoio |
| `cabecalho`, `rodape` | não | `false` para telas sem header/footer (ex.: login) |
| `blocos` | sim | conteúdo, de cima para baixo |
| `regras` | não | `[{ "alvo": "texto na tela" ou "/regex/", "nota": "**Negrito** e regra" }]` → anotações do handoff |

## Blocos

| `tipo` | Campos | Quando usar |
|---|---|---|
| `abas` | `itens`, `ativa`, `pequenas` | navegação entre vistas da mesma página. Contador: `"Pendentes (3)"` |
| `mensagem` | `nivel` (info, aviso, erro, sucesso), `titulo`, `texto`, `negrito`, `link` | avisos e feedback |
| `kpis` | `itens: [{rotulo, valor, sub, tipo, ativo}]` | indicadores numéricos no topo |
| `filtros` | `busca`, `grupos: [{rotulo, opcoes, marcada, multipla}]`, `aberto`, `aplicados`, `acoes` | busca + botão Filtros (padrão GOV.BR). `aberto: true` desenha o painel aberto |
| `tabela` | `titulo`, `busca`, `colunas: [{t, peso, alinhar:'dir', ordenar:false}]`, `linhas`, `selecionada`, `ordenadaPor`, `selecao`, `total`, `paginacao: {exibir, intervalo, pagina}` ou `false`, `vazio` | listas de registros |
| `formulario` | `titulo`, `descricao`, `colunas`, `campos`, `acoes: {primaria, secundaria, terciaria}` | entrada de dados |
| `cartoes` | `colunas`, `itens: [{titulo, rotulo, valor, texto, link, botao, tag}]` | atalhos, resumos |
| `lista` | `titulo`, `itens: [texto ou {titulo, descricao, tag, link}]` | listas simples de navegação |
| `passos` | `itens`, `ativo` | fluxos em etapas (wizard) |
| `acordeao` | `itens: [{titulo, texto}]`, `aberto` | perguntas frequentes, detalhes recolhíveis |
| `vazio` | `titulo`, `texto`, `botao` | estado sem dados |
| `upload` | `texto`, `ajuda`, `largura` | envio de arquivo |
| `resumo` | `pares: [[rótulo, valor ou {tag, tipo}]]` | dados de um registro em painel |
| `texto` | `titulo`, `texto` (string ou lista), `tamanho` | parágrafos |
| `acoes` | `itens: [texto ou {texto, tipo}]`, `alinhar: 'esq'` | grupo de botões solto |
| `tags`, `link` | — | elementos soltos |
| `secao` / `cartao` | `titulo`, `descricao`, `acao`, `blocos` | agrupar blocos (seção sem fundo / cartão branco) |
| `painel` | `kicker`, `titulo`, `tag`, `blocos`, `largura` | painel lateral de detalhe/ação |
| `duas-colunas` | `esquerda`, `direita`, `larguraDireita` (360) | lista + painel de detalhe |

### Campos do formulário

`{ "rotulo", "tipo": "texto|email|numero|select|data|textarea|radio|checkbox|busca", "valor", "placeholder", "opcoes", "obrigatorio", "ajuda", "erro", "desabilitado", "prefixo", "largura": "inteira", "horizontal" }`

### Células da tabela

Texto simples, ou:
- `{ "tag": "Ativo", "tipo": "ok|erro|aviso|info|neutro", "nota": "…" }`
- `{ "linhas": ["principal", "secundária"], "forte": false }`
- `{ "link": "Ver detalhe" }`
- `{ "acoes": ["Editar", "Excluir"] }`
- `{ "botao": "Abrir" }`
- `{ "erro": "Falhou" }`
- `{ "texto": "R$ 10,00", "cor": "#E52207" }`

## Dicas

- **Mesma largura de conteúdo em todas as resoluções:** o renderizador ajusta pela grade. Não repita telas por largura.
- **Tabela com muitas colunas (mais de 7):** mantenha as essenciais e mova as demais para o painel de detalhe, desde que esse detalhe exista no sistema.
- **Filtros:** campos de filtro que hoje ficam em linha viram `grupos` do painel. A busca textual fica visível.
