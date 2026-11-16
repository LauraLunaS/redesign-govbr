#!/usr/bin/env node
// Gera um plugin local do Figma (manifest.json + code.js) a partir do spec do redesign.
//
//   node gerar-plugin.mjs telas   --spec .redesign-govbr/spec.json [--area "Consumidor"] [--telas id1,id2] [--larguras 1440] [--saida pasta]
//   node gerar-plugin.mjs handoff --spec .redesign-govbr/spec.json [--area "Consumidor"] [--larguras 1280,1440] [--saida pasta]
//
// "telas" desenha as telas no DS GOV.BR (uma seção por área e largura).
// "handoff" monta as pranchas 03 DEV só das telas com status "aprovada".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(AQUI, 'figma-kit');
const ler = (f) => fs.readFileSync(path.join(KIT, f), 'utf8');

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } else o._.push(a);
  }
  return o;
}
const falhar = (m) => { console.error('Erro: ' + m); process.exit(1); };

const A = args(process.argv.slice(2));
const modo = A._[0];
if (!['telas', 'handoff'].includes(modo)) falhar('use "telas" ou "handoff". Ex.: node gerar-plugin.mjs telas --spec .redesign-govbr/spec.json');
if (!A.spec) falhar('informe --spec caminho/para/spec.json');
const spec = JSON.parse(fs.readFileSync(A.spec, 'utf8'));

// ---- validação do spec ----
const erros = [];
if (!spec.projeto) erros.push('spec.projeto (nome curto do sistema) é obrigatório');
if (!spec.figma || !spec.figma.pagina) erros.push('spec.figma.pagina (página de destino no Figma) é obrigatório');
if (!Array.isArray(spec.larguras) || !spec.larguras.length) erros.push('spec.larguras (ex.: [1280, 1440, 1920]) é obrigatório');
if (!Array.isArray(spec.telas) || !spec.telas.length) erros.push('spec.telas está vazio');
const ids = new Set();
for (const [i, t] of (spec.telas || []).entries()) {
  for (const k of ['id', 'nome', 'area', 'ordem']) if (t[k] == null || t[k] === '') erros.push(`telas[${i}] sem "${k}"`);
  if (ids.has(t.id)) erros.push(`id repetido: ${t.id}`); ids.add(t.id);
  if (/·/.test(t.nome || '') || /·/.test(t.area || '')) erros.push(`telas[${i}]: não use "·" em nome/área (é o separador dos nomes no Figma)`);
}
if (erros.length) falhar('spec inválido:\n - ' + erros.join('\n - '));

// ---- recorte ----
let telas = spec.telas.slice();
if (A.area) telas = telas.filter((t) => t.area === A.area);
if (A.telas) { const q = String(A.telas).split(',').map((s) => s.trim()); telas = telas.filter((t) => q.includes(t.id)); }
if (modo === 'handoff') telas = telas.filter((t) => t.status === 'aprovada');
if (!telas.length) falhar(modo === 'handoff' ? 'nenhuma tela com status "aprovada" no recorte' : 'nenhuma tela no recorte');
const larguras = A.larguras ? String(A.larguras).split(',').map(Number) : spec.larguras;

const specPlugin = { projeto: spec.projeto, figma: spec.figma, grid: spec.grid, cabecalho: spec.cabecalho, rodape: spec.rodape, biblioteca: spec.biblioteca };
const dados = `const SPEC = ${JSON.stringify(specPlugin)};\nconst TELAS = ${JSON.stringify(telas)};\nconst LARGURAS = ${JSON.stringify(larguras)};\n`;

const MAIN_TELAS = String.raw`
// ---------- execução ----------
const fundoDe = (nos) => nos.length ? Math.max(...nos.map((n) => n.y + n.height)) : 0;
async function main() {
  await prepararFontes();
  const falhasBib = await importarBiblioteca();
  const usadosBib = Object.keys(COMP);
  let pagina = figma.root.children.find((p) => p.name === SPEC.figma.pagina);
  if (!pagina) { pagina = figma.createPage(); pagina.name = SPEC.figma.pagina; }
  await figma.setCurrentPageAsync(pagina);
  await pagina.loadAsync();
  let yNova = fundoDe(pagina.children) + (pagina.children.length ? 600 : 0);
  const areas = [...new Set(TELAS.map((t) => t.area))];
  const feitas = [], erros = [];
  for (const area of areas) for (const W of LARGURAS) {
    const nomeS = nomeSecao(area, W);
    let sec = pagina.children.find((n) => n.type === 'SECTION' && n.name === nomeS);
    const nova = !sec;
    if (nova) { sec = figma.createSection(); sec.name = nomeS; pagina.appendChild(sec); sec.x = 0; sec.y = yNova; }
    const daArea = TELAS.filter((t) => t.area === area).sort((a, b) => a.ordem - b.ordem);
    for (const t of daArea) {
      const nome = nomeTela(t, W);
      let tela;
      try { tela = montarTela(t, W); } catch (e) { erros.push(nome + ': ' + (e && e.message ? e.message : e)); continue; }
      sec.appendChild(tela);
      const velha = sec.children.find((n) => n !== tela && n.name === nome);
      if (velha) {
        // nova no lugar da antiga; a antiga desce e fica marcada (nada é apagado)
        tela.x = velha.x; tela.y = velha.y;
        velha.name = nome + ' · anterior'; velha.y = fundoDe(sec.children.filter((n) => n !== velha)) + 400;
      } else {
        const outras = sec.children.filter((n) => n !== tela && !/ · anterior$/.test(n.name));
        tela.x = outras.length ? Math.max(...outras.map((n) => n.x + n.width)) + 120 : 120;
        tela.y = 160;
      }
      feitas.push(nome);
    }
    const k = sec.children;
    if (k.length) sec.resizeWithoutConstraints(Math.max(...k.map((n) => n.x + n.width)) + 120, Math.max(...k.map((n) => n.y + n.height)) + 120);
    if (nova) yNova = sec.y + sec.height + 400;
  }
  figma.viewport.scrollAndZoomIntoView(pagina.children.filter((n) => n.type === 'SECTION' && areas.some((a) => n.name.includes(' · ' + a + ' ('))));
  return feitas.length + ' telas desenhadas na página "' + pagina.name + '".' + (erros.length ? ' Falharam: ' + erros.join(' | ') : '') + ' Telas antigas com o mesmo nome foram mantidas com o sufixo "· anterior".' + avisoIcones() + (usadosBib.length ? ' Biblioteca DS: instâncias de ' + usadosBib.join(', ') + '.' : '') + (falhasBib.length ? ' Não consegui importar da biblioteca: ' + falhasBib.join(', ') + ' (verifique se a biblioteca está publicada e ativada neste arquivo em Assets → Libraries); usei o desenho do kit.' : '');
}
main().then((m) => figma.closePlugin(m)).catch((e) => figma.closePlugin('Erro: ' + (e && e.message ? e.message : e)));
`;

const MAIN_HANDOFF = String.raw`
// ---------- notas ----------
const esc = (s) => String(s).replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&');
const alvoDe = (a) => { const m = /^\/(.*)\/([a-z]*)$/.exec(a); return m ? new RegExp(m[1], m[2]) : a; };
const NOTAS_COMUNS = [
  { m: /^Filtros$/, t: '**Filtros** abre o painel de filtros (ver Componentes de filtro). **Aplicar** filtra e fecha o painel; **Limpar** desmarca tudo.' },
  { m: /^Exibir$/, t: '**Exibir:** quantidade de itens por página.' },
  { m: /^\d+\s*[–-]\s*\d+ de \d+ itens$/, t: '**Contagem:** intervalo exibido e total de itens da lista filtrada.' },
  { m: /^P[aá]gina$/, t: '**Página** escolhe a página; as setas ficam desabilitadas na primeira e na última página.' },
  { m: /^Limpar filtros$/, t: '**Filtros aplicados:** cada tag remove o próprio filtro; **Limpar filtros** remove todos.' },
];
const NOTAS_TELA = TELAS.filter((t) => t.regras && t.regras.length).map((t) => ({
  tela: new RegExp('·\\s*' + t.ordem + '\\s*·\\s*' + esc(t.nome) + '\\s*·'),
  notas: t.regras.map((r) => ({ m: alvoDe(r.alvo), t: r.nota })),
}));
function ehTelaDeQualquerLargura(n) { return ['FRAME', 'COMPONENT', 'INSTANCE'].includes(n.type) && [1280, 1366, 1440, 1920].some((w) => Math.abs(n.width - w) <= 1) && n.height >= 600; }

// ---------- componentes de filtro ----------
const NOTAS_COMP = {
  busca: ['Busca + botão Filtros', 'Campo de busca com lupa e botão **Filtros** (secundário, pílula, ícone de funil) na mesma linha, acima da lista.', 'A busca filtra pelo termo digitado. **Filtros** abre o painel; clicar de novo, clicar fora ou Esc fecha.'],
  painel: ['Painel de filtros aberto', 'Painel sobreposto com sombra, 317 px, ancorado abaixo do botão Filtros. Um grupo “Filtrar por …” por critério, separados por divisória.', '**Aplicar** (primário) filtra e fecha. **Limpar** (link) desmarca tudo. Radio = escolha única; checkbox = várias.'],
  aplicados: ['Filtros aplicados', 'Tags azul-claras com o critério ativo e ×; link “Limpar filtros” ao final.', 'O × remove só aquele filtro; Limpar filtros remove todos e a lista volta completa.'],
  cabecalho: ['Cabeçalho da tabela', 'Linha de 56 px, fundo #F0F0F0, títulos azuis #1351B4 com ícone de ordenação. Linhas de 64 px com linha inferior #CCCCCC.', 'Clicar no título ordena a coluna (crescente / decrescente). Textos longos truncam com reticências.'],
  paginacao: ['Paginação', '“Exibir [10 ▾] | intervalo de itens” à esquerda; “Página [1 ▾] | ‹ ›” à direita.', '**Exibir** muda os itens por página; **Página** escolhe a página; ‹ › desabilitadas nas pontas.'],
};
async function montarComponentes(quadro, telas, y) {
  const achar = (re) => { for (const t of telas) { const n = t.findOne((x) => re.test(x.name)); if (n) return n; } return null; };
  const itens = [['busca', /^Filtros$/], ['painel', /^Filtros · painel aberto$/], ['aplicados', /^Filtros aplicados$/], ['cabecalho', /^Cabe[cç]alho da tabela$/], ['paginacao', /^Pagina[cç][aã]o$/]]
    .map(([k, re]) => [k, achar(re)]).filter((x) => x[1]);
  if (!itens.length) return { y, n: 0, maxX: 0 };
  txt(quadro, 'Componentes de filtro', 160, y, { font: F.b, size: 72, cor: C.mq, name: 'Componentes de filtro' });
  y += 200; let x = 160, alt = 0;
  for (const [k, no] of itens) {
    const [tit, visual, regra] = NOTAS_COMP[k];
    const p = figma.createFrame(); p.name = 'Componente · ' + tit; p.fills = solid(C.prancha); p.clipsContent = false;
    quadro.appendChild(p); p.x = x; p.y = y;
    ret(p, 0, 0, 24, 10, C.faixa, { name: 'Faixa' });
    txt(p, 'HANDOFF · COMPONENTE DE FILTRO', 64, 48, { font: F.b, size: 16, cor: C.kicker });
    txt(p, tit, 64, 76, { font: F.b, size: 36, cor: C.titulo });
    const c = await clonarSeguro(no); c.visible = true; try { c.layoutPositioning = 'AUTO'; } catch (e) {}
    p.appendChild(c); c.x = 64; c.y = 200;
    linha(p, [[64, 180], [64 + c.width, 180]], C.rosa); pilula(p, Math.round(c.width) + ' px', 64 + c.width / 2, 164, 'centro');
    linha(p, [[84 + c.width, 200], [84 + c.width, 200 + c.height]], C.rosa); pilula(p, Math.round(c.height) + ' px', 92 + c.width, 200 + c.height / 2, 'esq');
    const xn = 64 + c.width + 140;
    const b1 = ret(p, xn, 200, COL, 10, C.spec, { raio: 2 });
    const t1 = txtRico(p, '**Visual:** ' + visual, xn + 16, 212, { size: 15, cor: C.specTxt, w: COL - 32, lh: 22 }); b1.resize(COL, t1.height + 24);
    const y2 = 200 + b1.height + 16;
    const b2 = ret(p, xn, y2, COL, 10, C.laranja, { name: 'Regra' });
    const t2 = txtRico(p, '**Comportamento:** ' + regra, xn + 16, y2 + 12, { size: 15, cor: C.branco, w: COL - 32, lh: 22 }); b2.resize(COL, t2.height + 24);
    const larg = xn + COL + 64, h = Math.max(200 + c.height, y2 + b2.height) + 80;
    p.resize(larg, h); p.findOne((n) => n.name === 'Faixa').resize(24, h);
    x += larg + 120; alt = Math.max(alt, h);
  }
  return { y: y + alt + 400, n: itens.length, maxX: x };
}

// ---------- execução ----------
async function main() {
  await prepararFontes();
  const pagina = figma.root.children.find((p) => p.name === SPEC.figma.pagina);
  if (!pagina) return 'Não achei a página "' + SPEC.figma.pagina + '". Rode antes o plugin de telas.';
  await figma.setCurrentPageAsync(pagina);
  await pagina.loadAsync();
  const areas = [...new Set(TELAS.map((t) => t.area))];
  const resumo = [], faltando = [];
  for (const area of areas) {
    const NOME_Q = 'HANDOFF · ' + SPEC.projeto + ' · ' + area;
    for (const q of pagina.children.filter((n) => n.name === NOME_Q)) q.name = NOME_Q + ' · versão anterior';
    const porW = [];
    for (const W of LARGURAS) {
      const sec = pagina.children.find((n) => n.type === 'SECTION' && n.name === nomeSecao(area, W));
      const lista = [];
      for (const t of TELAS.filter((x) => x.area === area).sort((a, b) => a.ordem - b.ordem)) {
        const tela = sec && sec.children.find((n) => n.name === nomeTela(t, W));
        if (tela) lista.push(tela); else faltando.push(nomeTela(t, W));
      }
      if (lista.length) porW.push([W, lista]);
    }
    if (!porW.length) continue;
    for (const [, l] of porW) for (const t of l) await carregarFontesDe(t);
    const fundo = Math.max(...pagina.children.map((n) => n.y + n.height));
    const quadro = figma.createFrame(); quadro.name = NOME_Q; quadro.fills = solid(C.fundoMenu); quadro.clipsContent = false;
    pagina.appendChild(quadro); quadro.x = 0; quadro.y = fundo + 3000;
    txt(quadro, 'DEV   ' + area.toUpperCase(), 160, 140, { font: F.b, size: 160, cor: C.titulo, name: 'Título do menu' });
    const badge = ret(quadro, 0, 150, 10, 10, C.verdeBadge, { name: 'Pronto para dev' });
    const tb = txt(quadro, 'PRONTO PARA DEV', 0, 0, { font: F.b, size: 80, cor: C.titulo });
    let y = 520, maxX = 0, n = 0;
    for (const [W, lista] of porW) {
      LARGURAS_ATUAL = [W];
      txt(quadro, 'Media Query (' + W + 'px)', 160, y, { font: F.b, size: 72, cor: C.mq, name: 'Media query ' + W });
      const yL = y + 240; let x = 160, alt = 0;
      for (const t of lista) { const c = await clonarSeguro(t); quadro.appendChild(c); c.x = x; c.y = yL; c.name = t.name; x += c.width + 120; alt = Math.max(alt, c.height); }
      const div = x + 120; let xp = div + 240;
      for (const t of lista) { const p = await montarPrancha(t, area, W, false); quadro.appendChild(p); p.x = xp; p.y = yL - 200; xp += p.width + 160; alt = Math.max(alt, p.height - 200); n++; }
      ret(quadro, div, yL - 200, 12, alt + 200, C.divisor, { name: 'Divisor' });
      maxX = Math.max(maxX, xp); y = yL + alt + 400;
    }
    const comp = await montarComponentes(quadro, porW[0][1], y);
    y = comp.y;
    const larg = Math.max(maxX + 160, comp.maxX + 160, 4000);
    quadro.resize(larg, y);
    badge.resize(tb.width + 120, tb.height + 60); badge.x = larg - badge.width - 200; badge.y = 120; tb.x = badge.x + 60; tb.y = badge.y + 30;
    resumo.push(area + ': ' + n + ' pranchas + ' + comp.n + ' componentes');
  }
  return 'Handoff criado — ' + resumo.join(' | ') + '.' + (faltando.length ? ' Telas não encontradas: ' + faltando.join('; ') : '') + ' As telas originais não foram alteradas.' + avisoIcones();
}
let LARGURAS_ATUAL = LARGURAS;
main().then((m) => figma.closePlugin(m)).catch((e) => figma.closePlugin('Erro: ' + (e && e.message ? e.message : e)));
`;

let code;
const cab = `// Gerado por redesign-govbr (${modo}) — ${spec.projeto} — ${new Date().toISOString().slice(0, 10)}\n`;
if (modo === 'telas') {
  code = cab + dados + ler('base.js') + '\n' + ler('ds-govbr.js') + '\n' + ler('telas.js') + '\n' + MAIN_TELAS;
} else {
  // a prancha usa LARGURAS em telasDaSecao: usamos LARGURAS_ATUAL para não conflitar
  const prancha = ler('handoff-prancha.js').replace(/\bLARGURAS\b/g, 'LARGURAS_ATUAL');
  code = cab + dados + ler('base.js') + '\n' + ler('ds-govbr.js') + '\n' + ler('telas.js') + '\n' + prancha + '\n' + MAIN_HANDOFF;
}

const sufixo = A.area ? '-' + String(A.area).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
const saida = A.saida || path.join(path.dirname(path.resolve(A.spec)), 'plugins', modo + sufixo);
fs.mkdirSync(saida, { recursive: true });
fs.writeFileSync(path.join(saida, 'code.js'), code);
const nomePlugin = `${spec.projeto} – ${modo === 'telas' ? 'Telas DS GOV.BR' : 'Handoff'}${A.area ? ' · ' + A.area : ''}`;
fs.writeFileSync(path.join(saida, 'manifest.json'), JSON.stringify({
  name: nomePlugin, id: 'redesign-govbr-' + modo + sufixo, api: '1.0.0', main: 'code.js', editorType: ['figma'], documentAccess: 'dynamic-page',
}, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, modo, telas: telas.length, larguras, manifest: path.join(saida, 'manifest.json') }, null, 2));
