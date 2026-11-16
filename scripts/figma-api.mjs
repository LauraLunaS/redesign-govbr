#!/usr/bin/env node
// Leitura do Figma pela API REST (gratuita, sem a cota do MCP). Só leitura.
// Precisa da variável de ambiente FIGMA_TOKEN (token pessoal: Figma → Settings → Security → Personal access tokens).
//
//   node figma-api.mjs paginas  <arquivo>                      lista as páginas
//   node figma-api.mjs secoes   <arquivo> [--pagina "Nome"] [--filtro "texto"]   seções e telas (frames) de cada uma
//   node figma-api.mjs textos   <arquivo> <nodeId>            textos visíveis de uma tela, em ordem de leitura
//   node figma-api.mjs png      <arquivo> <id1,id2,...> [--saida pasta] [--escala 0.5]   exporta PNG das telas
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
} else falhar('comando desconhecido: ' + cmd);
