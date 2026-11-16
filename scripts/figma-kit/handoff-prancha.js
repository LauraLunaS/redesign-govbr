// Prancha anotada de handoff (modelo 03 DEV): cotas, tipografia, grid, interações e regras.
// Usa NOTAS_COMUNS e NOTAS_TELA (definidas pelo gerador a partir do spec).

// ---------- prancha anotada ----------
const COL = 420, GAP = 120, TOPO = 340;

// notas das telas de menu aberto (seção MENU)
function notasMenu(titulo) {
  const n = [
    { m: titulo, t: '**' + titulo + '** (item do menu com seta) abre este painel e fica sublinhado em azul. Clicar de novo, clicar fora ou Esc fecha. Só um painel fica aberto por vez.' },
    { m: /^\d+\s+itens/i, t: '**Contador:** total de links do painel (e de seções, quando houver). Deve bater com a quantidade de links exibidos.' },
  ];
  if (/opera/i.test(titulo)) n.push({ m: 'Certificados', t: '**Seções:** Operação e Certificados, cada uma com título e linha azul; links empilhados abaixo.' });
  if (/cobran/i.test(titulo)) n.push({ m: 'Configurar e governar', t: '**4 seções em colunas.** A coluna mais longa define a altura do painel.' });
  return n;
}

async function montarPrancha(tela, menu, W, ehMenu) {
  const prancha = figma.createFrame();
  prancha.name = 'Handoff · ' + menu + ' · ' + tela.name; prancha.fills = solid(C.prancha); prancha.clipsContent = false;
  const sx = 24 + 40 + COL + GAP; // x da tela
  const copia = await clonarSeguro(tela);
  prancha.appendChild(copia); copia.x = sx; copia.y = TOPO; copia.name = tela.name;
  const H = copia.height;

  // textos visíveis
  const textos = copia.findAll((n) => n.type === 'TEXT' && visivel(n, copia) && n.characters.trim().length > 0)
    .map((n) => ({ n, r: rel(n, copia), s: n.characters.trim(), e: estiloTexto(n) }))
    .filter((t) => t.e && t.r.w > 0 && !/font awesome/i.test(t.e.fam))
    .sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x);
  // título = maior texto abaixo do cabeçalho do portal
  const abaixo = textos.filter((t) => t.r.y > 150);
  const h1 = (abaixo.length ? abaixo : textos).slice().sort((a, b) => b.e.tam - a.e.tam || a.r.y - b.r.y)[0];
  const tituloTela = h1 ? h1.s.replace(/\s+/g, ' ') : tela.name;
  const mNome = tela.name.match(/·\s*\d+\s*·\s*([^·]+?)\s*·\s*\d{4}\s*$/); const tituloPrancha = ehMenu ? 'Menu ' + tituloTela + ' aberto' : (mNome ? mNome[1] : tituloTela);

  // cabeçalho da prancha
  ret(prancha, 0, 0, 24, 10, C.faixa, { name: 'Faixa' });
  txt(prancha, 'HANDOFF · ' + menu.toUpperCase(), sx, 64, { font: F.b, size: 16, cor: C.kicker, name: 'Kicker' });
  txt(prancha, tituloPrancha + ' — ' + W + ' px', sx, 92, { font: F.b, size: 44, cor: C.titulo, name: 'Título' });
  const margem = h1 ? par(h1.r.x) : 0;
  txt(prancha, 'Medidas lidas da tela no Figma, em px. Conteúdo a partir de ' + margem + ' px da borda; tela com ' + par(H) + ' px de altura. Fonte ' + (h1 ? h1.e.fam : 'Rawline') + '.' + (copia.findOne((n) => n.type === 'TEXT' && /font awesome/i.test((n.fontName && n.fontName.family) || '')) ? ' Ícones: Font Awesome 5 Free (camadas “Ícone · fa-…”).' : ''), sx, 160,
    { size: 18, cor: C.lead, w: Math.min(W, 1100), lh: 28, name: 'Lead' });

  // legenda
  const leg = [[C.rosa, 'Cota (px)'], [C.spec, 'Tipografia e cor'], [C.verde, 'Interação → destino'], [C.laranja, 'Regra ou fluxo']];
  leg.forEach(([c, s], i) => { const y = 64 + i * 30; if (i === 2) bola(prancha, 72, y + 9, 12, c); else ret(prancha, 64, y + (i === 0 ? 8 : 2), 16, i === 0 ? 2 : 14, c, { op: 1 }); txt(prancha, s, 92, y, { size: 14, cor: C.lead }); });

  // nota de grid (topo direito)
  const nx = sx + W + GAP;
  const g = (copia.layoutGrids || []).find((x) => x.pattern === 'COLUMNS');
  let mgL = g ? (g.offset || 0) : 0, mgR = mgL;
  if (g && g.alignment !== 'STRETCH' && g.sectionSize) {
    const area = g.count * g.sectionSize + (g.count - 1) * (g.gutterSize || 0);
    mgL = g.alignment === 'CENTER' ? (W - area) / 2 + (g.offset || 0) : g.alignment === 'MIN' ? (g.offset || 0) : W - (g.offset || 0) - area;
    mgR = W - mgL - area;
  }
  const notaGrid = g ? '**Grid de ' + g.count + ' colunas:** calha de ' + g.gutterSize + ' px, margens de ' + par(mgL) + (par(mgR) !== par(mgL) ? ' / ' + par(mgR) : '') + ' px. Todos os valores em px.'
    : '**Alinhamento:** conteúdo a partir de ' + margem + ' px da borda da tela. Todos os valores em px.';
  const fg = ret(prancha, nx, 64, COL, 10, C.laranja, { name: 'Nota grid' });
  const tg = txtRico(prancha, notaGrid, nx + 16, 78, { size: 15, cor: C.branco, w: COL - 32, lh: 22 }); fg.resize(COL, tg.height + 28);

  // ----- cotas: blocos de primeiro nível (altura) -----
  let blocos = copia.children || [];
  while (blocos.length === 1 && blocos[0].children) blocos = blocos[0].children;
  blocos = blocos.filter((b) => b.visible !== false && b.absoluteBoundingBox).map((b) => ({ b, r: rel(b, copia) }))
    .filter((o) => o.r.h >= 24 && o.r.w >= W * 0.5).sort((a, b) => a.r.y - b.r.y);
  for (const { b, r } of blocos) {
    const x = sx - 14, y0 = TOPO + r.y, y1 = TOPO + r.y + r.h;
    linha(prancha, [[x - 5, y0], [x + 5, y0]], C.rosa, { name: 'Cota' }); linha(prancha, [[x, y0], [x, y1]], C.rosa, { name: 'Cota' }); linha(prancha, [[x - 5, y1], [x + 5, y1]], C.rosa, { name: 'Cota' });
    const nome = /^(frame|group|rectangle|container)\b/i.test(b.name) ? '' : b.name.replace(/\s*\d+$/, '') + ' ';
    pilula(prancha, nome + par(r.h) + ' px', x - 8, (y0 + y1) / 2, 'dir');
  }
  // margem lateral
  if (h1 && margem > 0) {
    const y = TOPO + h1.r.y + h1.r.h / 2;
    linha(prancha, [[sx, y], [sx + margem, y]], C.rosa); pilula(prancha, margem + ' px', sx + margem / 2, y - 16, 'centro');
  }

  // ----- cotas: cartões (largura e espaçamentos) -----
  const cartoes = [];
  (function andar(n) { for (const c of (n.children || [])) { if (c.visible === false) continue; if (ehCartao(c, W)) cartoes.push({ n: c, r: rel(c, copia) }); else andar(c); } })(copia);
  cartoes.sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x);
  const linhas = [];
  for (const c of cartoes) { const l = linhas.find((l) => Math.abs(l.y - c.r.y) <= 8); if (l) l.itens.push(c); else linhas.push({ y: c.r.y, itens: [c] }); }
  let anterior = null;
  for (const l of linhas.slice(0, 12)) {
    l.itens.sort((a, b) => a.r.x - b.r.x);
    const p = l.itens[0];
    pilula(prancha, (l.itens.length > 1 ? 'Cartão ' : 'Bloco ') + par(p.r.w) + ' px', sx + p.r.x + p.r.w / 2, TOPO + p.r.y - 2, 'centro');
    for (let i = 1; i < l.itens.length; i++) {
      const a = l.itens[i - 1], b = l.itens[i], gap = par(b.r.x - (a.r.x + a.r.w));
      if (gap > 0 && gap < 200) { const y = TOPO + a.r.y + Math.min(a.r.h, b.r.h) / 2; linha(prancha, [[sx + a.r.x + a.r.w, y], [sx + b.r.x, y]], C.rosa); pilula(prancha, gap + ' px', sx + a.r.x + a.r.w + gap / 2, y - 16, 'centro'); }
    }
    if (anterior) {
      const fim = Math.max(...anterior.itens.map((c) => c.r.y + c.r.h)), gap = par(l.y - fim);
      if (gap > 0 && gap < 200) { const ult = l.itens[l.itens.length - 1], x = sx + ult.r.x + ult.r.w + 10; linha(prancha, [[x, TOPO + fim], [x, TOPO + l.y]], C.rosa); pilula(prancha, gap + ' px', x + 6, TOPO + fim + gap / 2, 'esq'); }
    }
    anterior = l;
  }

  // ----- tipografia (coluna esquerda) -----
  let grupos = new Map();
  const chave = (e, solta) => solta ? [e.tam, e.peso, e.cor].join('|') : [e.fam, e.estilo, e.tam, e.lh, e.cor].join('|');
  for (const t of textos) { const k = chave(t.e); if (!grupos.has(k)) grupos.set(k, t); }
  if (grupos.size > 22) { grupos = new Map(); for (const t of textos) { const k = chave(t.e, true); if (!grupos.has(k)) grupos.set(k, t); } }
  const lista = [...grupos.values()].sort((a, b) => a.r.y - b.r.y).slice(0, 26);
  let yLivre = TOPO;
  for (const t of lista) {
    const alvoY = TOPO + t.r.y + t.r.h / 2;
    const cx = 64, cy = Math.max(alvoY - 24, yLivre);
    const caixa = ret(prancha, cx, cy, COL, 10, C.spec, { raio: 2, name: 'Tipografia' });
    const rot = t.s.replace(/\s+/g, ' '); const tt = txt(prancha, '“' + (rot.length > 38 ? rot.slice(0, 37) + '…' : rot) + '”', cx + 12, cy + 10, { font: F.b, size: 14, cor: C.specTit, w: COL - 24 });
    const corpo = t.e.fam + ' ' + t.e.tam + ' px · ' + t.e.estilo + ' ' + t.e.peso + ' · lh ' + t.e.lh + (t.e.cor ? ' · ' + t.e.cor : '');
    const tb = txt(prancha, corpo, cx + 12, tt.y + tt.height + 4, { size: 12, cor: C.specTxt, w: COL - 24, lh: 18 });
    caixa.resize(COL, tb.y + tb.height + 10 - cy);
    const meio = cy + caixa.height / 2, ax = sx + t.r.x;
    linha(prancha, [[cx + COL, meio], [cx + COL + GAP / 2, meio], [cx + COL + GAP / 2, alvoY], [ax, alvoY]], C.rosa, { peso: 1, name: 'Conector tipografia' });
    bola(prancha, ax, alvoY, 7, C.rosa);
    yLivre = cy + caixa.height + 8;
  }

  // ----- interações e regras (coluna direita) -----
  const regras = ehMenu ? notasMenu(tituloTela) : NOTAS_COMUNS.slice();
  if (!ehMenu) for (const g of NOTAS_TELA) if (g.tela.test(tituloTela) || g.tela.test(tela.name)) regras.push(...g.notas);
  const usados = new Set(), notas = [];
  for (const r of regras) {
    const livre = (t) => !usados.has(t.n.id);
    const alvo = r.m instanceof RegExp ? textos.find((t) => livre(t) && r.m.test(t.s))
      : (textos.find((t) => livre(t) && t.s === r.m) || textos.find((t) => livre(t) && t.s.startsWith(r.m)));
    if (!alvo) continue; usados.add(alvo.n.id); notas.push({ alvo, t: r.t });
  }
  if (ehMenu) {
    // link com fundo azul claro = estado hover
    const fundoClaro = (n) => { for (let p = n.parent, i = 0; p && i < 3; p = p.parent, i++) { const f = Array.isArray(p.fills) && p.fills.find((x) => x.type === 'SOLID' && x.visible !== false); if (f && f.color.b > f.color.r + 0.02 && f.color.r > 0.8) return true; } return false; };
    const hover = textos.find((t) => !usados.has(t.n.id) && t.r.y > 150 && fundoClaro(t.n));
    if (hover) { usados.add(hover.n.id); notas.push({ alvo: hover, t: '**' + hover.s + '** com fundo azul claro = estado de passar o mouse (hover) do link. Cada link leva à tela de mesmo nome e fecha o painel.' }); }
  }
  const vazio = textos.find((t) => /^(nenhum|nenhuma|ainda não)/i.test(t.s));
  if (vazio) notas.push({ alvo: vazio, t: '**Estado vazio:** “' + vazio.s.replace(/\s+/g, ' ') + '” aparece quando não há dados no período.' });
  notas.sort((a, b) => a.alvo.r.y - b.alvo.r.y);
  let yN = fg.y + fg.height + 24;
  for (const n of notas) {
    const alvoY = TOPO + n.alvo.r.y + n.alvo.r.h / 2;
    const y = Math.max(alvoY - 20, yN);
    const caixa = ret(prancha, nx, y, COL, 10, C.laranja, { name: 'Regra' });
    const tn = txtRico(prancha, n.t, nx + 16, y + 12, { size: 15, cor: C.branco, w: COL - 32, lh: 22 });
    caixa.resize(COL, tn.height + 24);
    const ax = sx + n.alvo.r.x + n.alvo.r.w + 6, meio = y + caixa.height / 2;
    linha(prancha, [[ax, alvoY], [nx - GAP / 2, alvoY], [nx - GAP / 2, meio], [nx, meio]], C.verde, { tracejado: true, peso: 2, name: 'Interação' });
    bola(prancha, ax, alvoY, 12, C.verde); bola(prancha, nx - GAP / 2, alvoY, 10, C.verde);
    yN = y + caixa.height + 12;
  }

  // tamanho final + faixa amarela em toda a altura
  const larg = nx + COL + 60;
  const alt = Math.max(TOPO + H, yLivre, yN) + 120;
  prancha.resize(larg, alt);
  prancha.findOne((n) => n.name === 'Faixa').resize(24, alt);
  return prancha;
}

// ---------- montagem por menu ----------
function nomeMenu(s) {
  let n = s.replace(/^portal\s*[-–]\s*/i, '').replace(/\(.*?\)/g, '').trim();
  n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  return n.replace(/^minha area$/i, 'Minha área').replace(/administracao/i, 'Administração');
}

function telasDaSecao(sec) {
  const larguraOk = (n) => LARGURAS.some((w) => Math.abs(n.width - w) <= 1);
  const ehTela = (n) => ['FRAME', 'COMPONENT', 'INSTANCE'].includes(n.type) && larguraOk(n) && n.height >= 600 && n.visible !== false;
  const out = [];
  (function andar(n) { for (const c of (n.children || [])) { if (ehTela(c)) out.push(c); else if (c.type !== 'INSTANCE' && !ehTelaDeQualquerLargura(c)) andar(c); } })(sec);
  return out;
}
