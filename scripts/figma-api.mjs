#!/usr/bin/env node
// Leitura do Figma pela API REST (gratuita, sem a cota do MCP). Só leitura.
// Precisa da variável de ambiente FIGMA_TOKEN (token pessoal: Figma → Settings → Security → Personal access tokens).
//
//   node figma-api.mjs paginas  <arquivo>                      lista as páginas
//   node figma-api.mjs secoes   <arquivo> [--pagina "Nome"] [--filtro "texto"]   seções e telas (frames) de cada uma
//   node figma-api.mjs textos   <arquivo> <nodeId>            textos visíveis de uma tela, em ordem de leitura
//   node figma-api.mjs png      <arquivo> <id1,id2,...> [--saida pasta] [--escala 0.5]   exporta PNG das telas
//   node figma-api.mjs padroes  <arquivo> <id1,id2,...>       padrões visuais de telas de referência (fontes, cores, raios, espaçamentos, blocos)
//   node figma-api.mjs biblioteca <arquivo> [--saida arq.json] componentes, conjuntos de variantes e estilos PUBLICADOS no arquivo da biblioteca
//        (o token precisa também do escopo "Read components and styles published from individual files")
//
// <arquivo> pode ser a chave (ex.: BsnL8jAuBMh3fzXO3Wwltd) ou o link completo do Figma.
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.FIGMA_TOKEN;
const falhar = (m) => { console.error('Erro: ' + m); process.exit(1); };
if (!TOKEN) falhar('defina a variável de ambiente FIGMA_TOKEN com o seu token pessoal do Figma (não coloque o token em arquivos do projeto).');

const argv = process.argv.slice(2);
const opt = {}; const pos = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(argv[i]); }
const [cmd, arqBruto, alvo] = pos;
if (!cmd || !arqBruto) falhar('uso: node figma-api.mjs <paginas|secoes|textos|png> <arquivo> [...]');
const chave = (() => { const m = /figma\.com\/(?:design|file)\/([A-Za-z0-9]+)(?:\/branch\/([A-Za-z0-9]+))?/.exec(arqBruto); return m ? (m[2] || m[1]) : arqBruto; })();

async function api(caminho) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const r = await fetch('https://api.figma.com/v1/' + caminho, { headers: { 'X-Figma-Token': TOKEN } });
    if (r.status === 429) { const s = Number(r.headers.get('retry-after') || 10); await new Promise((ok) => setTimeout(ok, Math.min(60, s) * 1000)); continue; }
    if (!r.ok) falhar(`API do Figma respondeu ${r.status} em ${caminho.split('?')[0]}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
  falhar('limite de requisições da API do Figma; tente de novo em alguns minutos.');
}
const LARG = [1280, 1366, 1440, 1920, 375, 390, 768];
const ehTela = (n) => ['FRAME', 'COMPONENT', 'INSTANCE'].includes(n.type) && n.absoluteBoundingBox && LARG.some((w) => Math.abs(n.absoluteBoundingBox.width - w) <= 2) && n.absoluteBoundingBox.height >= 600;

if (cmd === 'paginas') {
  const f = await api(`files/${chave}?depth=1`);
  console.log(JSON.stringify({ arquivo: f.name, ultimaAlteracao: f.lastModified, paginas: f.document.children.map((p) => ({ id: p.id, nome: p.name })) }, null, 2));
} else if (cmd === 'secoes') {
  const f = await api(`files/${chave}?depth=1`);
  let paginas = f.document.children;
  if (opt.pagina) paginas = paginas.filter((p) => p.name === opt.pagina);
  const out = [];
  for (const p of paginas) {
    const d = await api(`files/${chave}/nodes?ids=${encodeURIComponent(p.id)}&depth=4`);
    const pg = d.nodes[p.id].document;
    const andar = (n, sec) => {
      for (const c of n.children || []) {
        if (c.type === 'SECTION') { const s = { pagina: p.name, id: c.id, nome: c.name, telas: [] }; out.push(s); andar(c, s); }
        else if (ehTela(c)) (sec || (out.find((x) => x.id === 'solto:' + p.id) || out[out.push({ pagina: p.name, id: 'solto:' + p.id, nome: '(fora de seção)', telas: [] }) - 1])).telas.push({ id: c.id, nome: c.name, largura: Math.round(c.absoluteBoundingBox.width), altura: Math.round(c.absoluteBoundingBox.height) });
        else if (c.type === 'FRAME' || c.type === 'GROUP') andar(c, sec);
      }
    };
    andar(pg, null);
  }
  const filtradas = opt.filtro ? out.filter((s) => s.nome.toLowerCase().includes(String(opt.filtro).toLowerCase())) : out;
  console.log(JSON.stringify({ arquivo: f.name, ultimaAlteracao: f.lastModified, secoes: filtradas }, null, 2));
} else if (cmd === 'textos') {
  if (!alvo) falhar('informe o id do nó (ex.: 123:456)');
  const d = await api(`files/${chave}/nodes?ids=${encodeURIComponent(alvo)}`);
  const raiz = d.nodes[alvo] && d.nodes[alvo].document;
  if (!raiz) falhar('nó não encontrado: ' + alvo);
  const b0 = raiz.absoluteBoundingBox || { x: 0, y: 0 };
  const textos = [];
  const andar = (n) => { if (n.visible === false) return; if (n.type === 'TEXT' && n.characters && n.characters.trim()) { const b = n.absoluteBoundingBox || b0; textos.push({ y: Math.round(b.y - b0.y), x: Math.round(b.x - b0.x), tam: n.style && n.style.fontSize, texto: n.characters.trim().replace(/\s+/g, ' ') }); } for (const c of n.children || []) andar(c); };
  andar(raiz);
  textos.sort((a, b) => a.y - b.y || a.x - b.x);
  console.log(JSON.stringify({ nome: raiz.name, largura: Math.round(b0.width || 0), altura: Math.round(b0.height || 0), textos }, null, 2));
} else if (cmd === 'png') {
  if (!alvo) falhar('informe os ids separados por vírgula');
  const saida = opt.saida || '.redesign-govbr/figma';
  fs.mkdirSync(saida, { recursive: true });
  const ids = alvo.split(',').map((s) => s.trim()).filter(Boolean);
  const nomes = {};
  const info = await api(`files/${chave}/nodes?ids=${encodeURIComponent(ids.join(','))}&depth=1`);
  for (const id of ids) nomes[id] = info.nodes[id] ? info.nodes[id].document.name : id;
  const salvos = [];
  for (let i = 0; i < ids.length; i += 10) {
    const lote = ids.slice(i, i + 10);
    const r = await api(`images/${chave}?ids=${encodeURIComponent(lote.join(','))}&format=png&scale=${opt.escala || 0.5}`);
    for (const id of lote) {
      const url = r.images[id]; if (!url) continue;
      const bin = Buffer.from(await (await fetch(url)).arrayBuffer());
      const arq = path.join(saida, (nomes[id] || id).replace(/[^\w\-À-ú ·–]+/g, '').replace(/\s+/g, '_').slice(0, 90) + '__' + id.replace(':', '-') + '.png');
      fs.writeFileSync(arq, bin); salvos.push(arq);
    }
  }
  console.log(JSON.stringify({ salvos }, null, 2));
} else if (cmd === 'padroes') {
  if (!alvo) falhar('informe os ids das telas de referência separados por vírgula');
  const ids = alvo.split(',').map((s) => s.trim()).filter(Boolean);
  const d = await api(`files/${chave}/nodes?ids=${encodeURIComponent(ids.join(','))}`);
  const hexDe = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  const conta = () => new Map();
  const add = (m, k) => { if (k == null || k === '') return; m.set(k, (m.get(k) || 0) + 1); };
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n || 15).map(([k, v]) => ({ valor: k, vezes: v }));
  const telas = [];
  for (const id of ids) {
    const raiz = d.nodes[id] && d.nodes[id].document; if (!raiz) continue;
    const fontes = conta(), corTexto = conta(), corFundo = conta(), corBorda = conta(), raios = conta(), gaps = conta(), paddings = conta(), alturas = conta();
    const andar = (n) => {
      if (n.visible === false) return;
      if (n.type === 'TEXT' && n.style) { add(fontes, `${n.style.fontFamily} ${n.style.fontSize}px ${n.style.fontWeight}`); const f = (n.fills || []).find((p) => p.type === 'SOLID'); if (f) add(corTexto, hexDe(f.color)); }
      else {
        const f = (n.fills || []).find((p) => p.type === 'SOLID' && p.visible !== false); if (f) add(corFundo, hexDe(f.color));
        const s = (n.strokes || []).find((p) => p.type === 'SOLID' && p.visible !== false); if (s) add(corBorda, hexDe(s.color));
        if (n.cornerRadius) add(raios, n.cornerRadius);
        if (n.layoutMode && n.layoutMode !== 'NONE') { add(gaps, n.itemSpacing || 0); add(paddings, [n.paddingTop || 0, n.paddingRight || 0, n.paddingBottom || 0, n.paddingLeft || 0].join('/')); }
        if (/bot[aã]o|button|linha|row|input|campo/i.test(n.name) && n.absoluteBoundingBox) add(alturas, n.name.split(/[·|/]/)[0].trim() + ' → ' + Math.round(n.absoluteBoundingBox.height) + 'px');
      }
      for (const c of n.children || []) andar(c);
    };
    andar(raiz);
    const b0 = raiz.absoluteBoundingBox || {};
    const blocos = (raiz.children || []).filter((c) => c.visible !== false).map((c) => c.name + (c.absoluteBoundingBox ? ` (${Math.round(c.absoluteBoundingBox.width)}×${Math.round(c.absoluteBoundingBox.height)})` : ''));
    const grade = (raiz.layoutGrids || []).filter((g) => g.pattern === 'COLUMNS').map((g) => ({ colunas: g.count, calha: g.gutterSize, margem: g.offset, alinhamento: g.alignment }));
    telas.push({ id, nome: raiz.name, largura: Math.round(b0.width || 0), grade, blocos, fontes: top(fontes), corTexto: top(corTexto, 8), corFundo: top(corFundo, 10), corBorda: top(corBorda, 8), raios: top(raios, 6), gaps: top(gaps, 8), paddings: top(paddings, 8), alturas: top(alturas, 12) });
  }
  console.log(JSON.stringify({ telas }, null, 2));
} else if (cmd === 'biblioteca') {
  const [comps, sets, estilos] = [await api(`files/${chave}/components`), await api(`files/${chave}/component_sets`), await api(`files/${chave}/styles`)];
  const c = (comps.meta && comps.meta.components) || [], s = (sets.meta && sets.meta.component_sets) || [], e = (estilos.meta && estilos.meta.styles) || [];
  const emSet = new Set(c.filter((x) => x.containing_frame && x.containing_frame.containingComponentSet).map((x) => x.key));
  const out = {
    arquivo: chave,
    conjuntos: s.map((x) => ({ nome: x.name, key: x.key, descricao: (x.description || '').slice(0, 160), pagina: x.containing_frame && x.containing_frame.pageName })),
    componentes: c.filter((x) => !emSet.has(x.key)).map((x) => ({ nome: x.name, key: x.key, descricao: (x.description || '').slice(0, 160), pagina: x.containing_frame && x.containing_frame.pageName })),
    variantes: c.filter((x) => emSet.has(x.key)).length,
    estilos: e.map((x) => ({ nome: x.name, tipo: x.style_type, key: x.key })),
  };
  if (!out.conjuntos.length && !out.componentes.length) out.aviso = 'Nenhum componente publicado neste arquivo. A biblioteca precisa estar publicada (Assets → Publish) para que os componentes possam ser usados como instâncias.';
  if (opt.saida) { fs.mkdirSync(path.dirname(opt.saida), { recursive: true }); fs.writeFileSync(opt.saida, JSON.stringify(out, null, 2)); }
  console.log(JSON.stringify({ conjuntos: out.conjuntos.length, componentes: out.componentes.length, variantes: out.variantes, estilos: out.estilos.length, salvo: opt.saida || null, aviso: out.aviso, amostra: out.conjuntos.slice(0, 30).map((x) => x.nome) }, null, 2));
} else falhar('comando desconhecido: ' + cmd);
