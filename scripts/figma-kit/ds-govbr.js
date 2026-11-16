// Kit DS GOV.BR desenhado com camadas editáveis (auto layout). Cores e medidas do Design System GOV.BR.
const G = {
  azul: hex('#1351B4'), azulEsc: hex('#071D41'), tx: hex('#333333'), tx2: hex('#555555'), ph: hex('#888888'),
  linha: hex('#CCCCCC'), linhaFina: hex('#E6E6E6'), cab: hex('#EDEDED'), cinza: hex('#F8F8F8'), branco: hex('#FFFFFF'),
  sel: hex('#DBE8FB'), azulClaro: hex('#EEF4FD'), infoBg: hex('#D4E5FF'), avisoBg: hex('#FFF5C2'),
  ok: hex('#168821'), erro: hex('#E52207'), aviso: hex('#FFCD07'),
};
const SOMBRA = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.16 }, offset: { x: 0, y: 1 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }];
const ehAuto = (n) => !!(n && n.layoutMode && n.layoutMode !== 'NONE');

function box(pai, dir, o) {
  o = o || {};
  const f = figma.createFrame();
  f.name = o.name || (dir === 'VERTICAL' ? 'Coluna' : 'Linha');
  f.layoutMode = dir; f.fills = o.bg ? solid(o.bg) : []; f.itemSpacing = o.gap || 0; f.clipsContent = false;
  const p = o.pad == null ? 0 : o.pad; const pp = Array.isArray(p) ? p : [p, p, p, p];
  f.paddingTop = pp[0]; f.paddingRight = pp[1]; f.paddingBottom = pp[2]; f.paddingLeft = pp[3];
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (o.r) f.cornerRadius = o.r;
  if (o.stroke) { f.strokes = solid(o.stroke); f.strokeWeight = o.sw || 1; f.strokeAlign = 'INSIDE'; }
  if (o.sombra) f.effects = SOMBRA;
  if (o.align) f.counterAxisAlignItems = o.align;
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  pai.appendChild(f);
  if (typeof o.w === 'number' || typeof o.h === 'number') {
    f.resize(typeof o.w === 'number' ? o.w : Math.max(1, f.width), typeof o.h === 'number' ? o.h : Math.max(1, f.height));
    if (typeof o.w !== 'number') f.layoutSizingHorizontal = 'HUG';
    if (typeof o.h !== 'number') f.layoutSizingVertical = 'HUG';
  }
  if (o.w === 'FILL' && ehAuto(pai)) f.layoutSizingHorizontal = 'FILL';
  if (o.h === 'FILL' && ehAuto(pai)) f.layoutSizingVertical = 'FILL';
  return f;
}
function T(pai, s, o) {
  o = o || {};
  const t = figma.createText();
  t.fontName = o.font || F.r; t.fontSize = o.size || 14; t.characters = String(s);
  t.fills = solid(o.cor || G.tx);
  t.lineHeight = o.lh ? { unit: 'PIXELS', value: o.lh } : { unit: 'PERCENT', value: 145 };
  t.name = o.name || String(s).slice(0, 48);
  if (o.bold) { const i = String(s).indexOf(o.bold); if (i >= 0) t.setRangeFontName(i, i + o.bold.length, F.b); }
  pai.appendChild(t);
  if (o.fill && ehAuto(pai)) { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; }
  else if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); }
  if (o.dir) t.textAlignHorizontal = 'RIGHT';
  return t;
}
function vetor(pai, d, w, h, cor, nome, peso) {
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONE', data: d }];
  v.strokes = solid(cor); v.strokeWeight = peso || 2; v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND'; v.fills = [];
  v.name = nome || 'Ícone';
  const f = figma.createFrame(); f.name = 'Ícone · ' + (nome || ''); f.fills = []; f.resize(w + 4, h + 4); f.clipsContent = false;
  f.appendChild(v); v.x = 2; v.y = 2;
  pai.appendChild(f);
  return f;
}
const ICO = {
  chevBaixo: (p, c) => vetor(p, 'M 0 0 L 5 5 L 10 0', 10, 5, c || G.azul, 'chevron'),
  chevDir: (p, c) => vetor(p, 'M 0 0 L 5 5 L 0 10', 5, 10, c || G.azul, 'seta'),
  chevEsq: (p, c) => vetor(p, 'M 5 0 L 0 5 L 5 10', 5, 10, c || G.azul, 'seta'),
  lupa: (p, c) => vetor(p, 'M 11 6 C 11 8.76 8.76 11 6 11 C 3.24 11 1 8.76 1 6 C 1 3.24 3.24 1 6 1 C 8.76 1 11 3.24 11 6 Z M 9.6 9.6 L 14 14', 14, 14, c || G.azul, 'buscar'),
  cal: (p, c) => vetor(p, 'M 1 3 L 13 3 L 13 14 L 1 14 Z M 1 6.5 L 13 6.5 M 4 1 L 4 4 M 10 1 L 10 4', 14, 14, c || G.tx2, 'calendário', 1.5),
  fechar: (p, c) => vetor(p, 'M 0 0 L 10 10 M 10 0 L 0 10', 10, 10, c || G.azul, 'fechar'),
  doc: (p, c) => vetor(p, 'M 1 1 L 9 1 L 13 5 L 13 16 L 1 16 Z M 9 1 L 9 5 L 13 5', 14, 16, c || G.azul, 'documento', 1.5),
  recarregar: (p, c) => vetor(p, 'M 12 7 C 12 9.76 9.76 12 7 12 C 4.24 12 2 9.76 2 7 C 2 4.24 4.24 2 7 2 C 8.6 2 10 2.8 10.9 4 M 11 1 L 11 4 L 8 4', 13, 13, c || G.azul, 'atualizar', 1.6),
};
function selo(pai, letra, bg, cor, d) {
  d = d || 20;
  const f = box(pai, 'HORIZONTAL', { name: 'Ícone · ' + letra, bg, r: d / 2, align: 'CENTER', justify: 'CENTER' });
  f.resize(d, d); f.layoutSizingHorizontal = 'FIXED'; f.layoutSizingVertical = 'FIXED';
  T(f, letra, { font: F.b, size: Math.round(d * 0.6), cor: cor || G.branco, lh: d });
  return f;
}
function ponto(pai, cor, d) { const e = figma.createEllipse(); e.resize(d || 8, d || 8); e.fills = solid(cor); e.name = 'Indicador'; pai.appendChild(e); return e; }

const TAG = { ok: [G.ok, G.branco], erro: [G.erro, G.branco], aviso: [G.aviso, G.tx], info: [G.azul, G.branco], neutro: [G.linhaFina, G.tx] };
function tag(pai, s, k) {
  const [bg, cor] = TAG[k || 'neutro'];
  const f = box(pai, 'HORIZONTAL', { name: 'Tag · ' + s, bg, r: 4, pad: [2, 8, 2, 8], align: 'CENTER' });
  T(f, s, { font: F.sb, size: 12, cor, lh: 18 });
  return f;
}
function botao(pai, s, tipo, o) {
  o = o || {};
  // instância da biblioteca DS GOV.BR, quando mapeada no spec (papel botao-primario/secundario/terciario)
  if (typeof instanciaDe === 'function') { const i = instanciaDe(pai, 'botao-' + (tipo || 'secundario'), s, { pequeno: o.peq }); if (i) return i; }
  const pri = tipo === 'primario', ter = tipo === 'terciario';
  const f = box(pai, 'HORIZONTAL', {
    name: 'Botão ' + (pri ? 'primário' : ter ? 'terciário' : 'secundário') + ' · ' + s,
    bg: pri ? G.azul : ter ? null : G.branco, stroke: pri || ter ? null : (o.cor || G.azul), r: 100,
    pad: o.peq ? [6, 16, 6, 16] : [10, 24, 10, 24], gap: 8, align: 'CENTER', justify: 'CENTER',
  });
  if (o.icone) ICO[o.icone](f, pri ? G.branco : (o.cor || G.azul));
  T(f, s, { font: F.sb, size: 14, cor: pri ? G.branco : (o.cor || G.azul), lh: 20 });
  return f;
}
function link(pai, s, o) { return T(pai, s, Object.assign({ font: F.sb, cor: G.azul, size: 14 }, o || {})); }
function campo(pai, rotulo, valor, o) {
  o = o || {};
  const w = box(pai, 'VERTICAL', { name: 'Campo · ' + (rotulo || valor), gap: 4, w: o.w || 'FILL' });
  if (rotulo) T(w, rotulo, { font: F.sb, size: 14, lh: 20 });
  const f = box(w, 'HORIZONTAL', { name: 'Entrada', bg: G.branco, stroke: G.ph, r: 4, pad: [0, 12, 0, 12], gap: 8, align: 'CENTER', w: 'FILL', h: o.alto || 40 });
  if (o.alto) f.counterAxisAlignItems = 'MIN', f.paddingTop = 10;
  if (o.ico === 'cal') ICO.cal(f);
  if (o.prefixo) T(f, o.prefixo, { size: 14, cor: G.tx2 });
  T(f, valor, { size: 14, cor: o.ph ? G.ph : G.tx, fill: true, lh: 20 });
  if (o.ico === 'lupa') ICO.lupa(f);
  if (o.ico === 'select') ICO.chevBaixo(f);
  if (o.ajuda) T(w, o.ajuda, { size: 12, cor: G.tx2, lh: 18 });
  return w;
}
function linhaCampos(pai, itens, gap) {
  const r = box(pai, 'HORIZONTAL', { name: 'Filtros', gap: gap || 16, w: 'FILL' });
  for (const it of itens) campo(r, it[0], it[1], Object.assign({ w: 'FILL' }, it[2] || {}));
  return r;
}
function cartao(pai, o) {
  o = o || {};
  const c = box(pai, 'VERTICAL', { name: 'Cartão · ' + (o.titulo || ''), bg: G.branco, r: 4, sombra: true, pad: o.pad == null ? 24 : o.pad, gap: o.gap || 16, w: o.w || 'FILL', h: o.h });
  if (o.tracejado) { c.effects = []; c.strokes = solid(G.linha); c.strokeWeight = 1; c.dashPattern = [6, 4]; }
  if (o.topo) { c.strokes = solid(G.azul); c.strokeTopWeight = 4; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 0; }
  if (o.titulo) {
    const h = box(c, 'HORIZONTAL', { name: 'Cabeçalho', gap: 16, w: 'FILL', align: 'CENTER' });
    const l = box(h, 'VERTICAL', { name: 'Título', gap: 2, w: 'FILL' });
    const tl = box(l, 'HORIZONTAL', { name: 'Título e tag', gap: 8, align: 'CENTER' });
    if (o.kicker) T(l, o.kicker, { size: 12, cor: G.tx2, lh: 18 }), l.insertChild(0, l.children[l.children.length - 1]);
    T(tl, o.titulo, { font: F.sb, size: o.tamTit || 18, lh: 26 });
    if (o.tag) tag(tl, o.tag[0], o.tag[1]);
    if (o.sub) T(l, o.sub, { size: 12, cor: G.tx2, fill: true, lh: 18 });
    if (o.direita) o.direita(h);
  }
  return c;
}
function mensagem(pai, tipo, texto, o) {
  o = o || {};
  const bg = tipo === 'aviso' ? G.avisoBg : G.infoBg;
  const m = box(pai, 'HORIZONTAL', { name: 'Mensagem · ' + tipo, bg, r: 4, pad: 16, gap: 12, w: 'FILL', align: 'MIN' });
  if (tipo === 'aviso') selo(m, '!', G.aviso, G.tx); else selo(m, 'i', G.azul);
  T(m, texto, { size: 14, fill: true, bold: o.bold, lh: 20 });
  if (o.link) link(m, o.link);
  return m;
}
function abas(pai, nomes, ativa, o) {
  o = o || {};
  const b = box(pai, 'HORIZONTAL', { name: o.nome || 'Abas', w: 'FILL' });
  b.strokes = solid(G.linha); b.strokeTopWeight = 0; b.strokeLeftWeight = 0; b.strokeRightWeight = 0; b.strokeBottomWeight = 1;
  for (const n of nomes) {
    const at = n === ativa;
    const it = box(b, 'HORIZONTAL', { name: 'Aba · ' + n + (at ? ' (ativa)' : ''), pad: o.peq ? [12, 16, 10, 16] : [16, 24, 12, 24], gap: 6, align: 'CENTER' });
    if (at) { it.strokes = solid(G.azul); it.strokeTopWeight = 0; it.strokeLeftWeight = 0; it.strokeRightWeight = 0; it.strokeBottomWeight = 4; }
    const m = /^(.*) \((\d+)\)$/.exec(n);
    T(it, m ? m[1] : n, { font: at ? F.sb : F.r, size: o.peq ? 14 : 16, cor: at ? G.azul : G.tx2 });
    if (m) { const k = box(it, 'HORIZONTAL', { name: 'Contador', bg: at ? G.azul : G.linhaFina, r: 100, pad: [0, 6, 0, 6] }); T(k, m[2], { font: F.sb, size: 11, cor: at ? G.branco : G.tx, lh: 16 }); }
  }
  return b;
}
// tabela: colunas [nome, peso, alinhamento?]; célula = texto | {tag,k} | {l:[linha1, linha2]} | {link} | {btn} | {perigo} | {cor, t}
function tabela(pai, w, cols, linhas, o) {
  o = o || {};
  const t = box(pai, 'VERTICAL', { name: o.nome || 'Tabela', w });
  const soma = cols.reduce((a, c) => a + c[1], 0);
  const lw = cols.map((c) => Math.floor((c[1] / soma) * w));
  const linhaDe = (cells, cab, sel) => {
    const r = box(t, 'HORIZONTAL', { name: cab ? 'Cabeçalho da tabela' : 'Linha', bg: cab ? G.cab : sel ? G.sel : null, w: 'FILL', align: 'CENTER' });
    if (!cab) { r.strokes = solid(G.linhaFina); r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; }
    cells.forEach((v, i) => {
      const dir = cols[i][2] === 'dir';
      const c = box(r, 'VERTICAL', { name: 'Célula · ' + cols[i][0], pad: [12, 12, 12, 12], gap: 2, w: lw[i], align: dir ? 'MAX' : 'MIN' });
      if (cab) { T(c, v, { font: F.sb, size: 13, lh: 20, w: lw[i] - 24, dir }); return; }
      if (v == null || v === '') v = '—';
      if (typeof v === 'string') T(c, v, { size: 13, lh: 20, w: lw[i] - 24, dir });
      else if (v.tag) { tag(c, v.tag, v.k); if (v.nota) T(c, v.nota, { size: 11, cor: G.tx2, lh: 16, w: lw[i] - 24 }); }
      else if (v.l) { T(c, v.l[0], { font: v.forte === false ? F.r : F.sb, size: 13, lh: 20, w: lw[i] - 24 }); for (const x of v.l.slice(1)) T(c, x, { size: 11, cor: v.cor2 || G.tx2, lh: 16, w: lw[i] - 24 }); }
      else if (v.link) link(c, v.link, { size: 13 });
      else if (v.btn) botao(c, v.btn, 'secundario', { peq: true, icone: v.icone });
      else if (v.perigo) T(c, v.perigo, { font: F.sb, size: 13, cor: G.erro });
      else if (v.t) T(c, v.t, { font: v.font || F.r, size: 13, cor: v.cor || G.tx, lh: 20, w: lw[i] - 24 });
    });
    return r;
  };
  linhaDe(cols.map((c) => c[0]), true);
  linhas.forEach((l, i) => linhaDe(l, false, o.sel === i));
  if (o.total) { const r = linhaDe(o.total, false); r.children.forEach((c) => c.children.forEach((x) => { if (x.type === 'TEXT') x.fontName = F.b; })); }
  if (o.rodape) {
    const p = box(pai, 'HORIZONTAL', { name: 'Paginação', w, align: 'CENTER', gap: 16 });
    T(p, o.rodape, { size: 12, cor: G.tx2 });
    if (o.linkRodape) link(p, o.linkRodape, { size: 12 });
    box(p, 'HORIZONTAL', { name: 'Espaço', w: 'FILL' });
    ICO.chevEsq(p, G.ph); ICO.chevDir(p);
  }
  return t;
}
function kpi(pai, w, rotulo, valor, sub, o) {
  o = o || {};
  const c = box(pai, 'VERTICAL', { name: 'Indicador · ' + rotulo, bg: o.ativo ? G.azulClaro : G.branco, r: 4, sombra: true, pad: 16, gap: 4, w });
  if (o.ativo) { c.strokes = solid(G.azul); c.strokeWeight = 2; }
  const l = box(c, 'HORIZONTAL', { name: 'Rótulo', gap: 6, align: 'CENTER' });
  if (o.ponto) ponto(l, o.ponto);
  T(l, rotulo, { size: 12, cor: G.tx2, lh: 18 });
  T(c, valor, { font: F.b, size: 24, cor: o.cor || G.tx, lh: 32 });
  if (sub) T(c, sub, { size: 12, cor: G.tx2, lh: 18 });
  return c;
}
function radio(pai, titulo, desc, sel) {
  const r = box(pai, 'HORIZONTAL', { name: 'Opção · ' + titulo + (sel ? ' (selecionada)' : ''), bg: sel ? G.azulClaro : G.branco, stroke: sel ? G.azul : G.linha, sw: sel ? 2 : 1, r: 4, pad: 12, gap: 12, w: 'FILL' });
  const e = figma.createEllipse(); e.resize(18, 18); e.fills = solid(G.branco); e.strokes = solid(sel ? G.azul : G.ph); e.strokeWeight = sel ? 5 : 1.5; e.name = 'Radio'; r.appendChild(e);
  const v = box(r, 'VERTICAL', { name: 'Texto', gap: 2, w: 'FILL' });
  T(v, titulo, { font: F.sb, size: 14, lh: 20 });
  if (desc) T(v, desc, { size: 12, cor: G.tx2, fill: true, lh: 18 });
  return r;
}
function resumo(pai, pares) {
  const b = box(pai, 'VERTICAL', { name: 'Resumo', bg: G.cinza, r: 4, pad: 16, gap: 12, w: 'FILL' });
  for (let i = 0; i < pares.length; i += 2) {
    const r = box(b, 'HORIZONTAL', { name: 'Linha', gap: 16, w: 'FILL' });
    for (const [k, v] of pares.slice(i, i + 2)) {
      const it = box(r, 'VERTICAL', { name: k, gap: 2, w: 'FILL' });
      T(it, k, { size: 12, cor: G.tx2, lh: 18 });
      if (typeof v === 'string') T(it, v, { font: F.sb, size: 14, fill: true, lh: 20 }); else tag(it, v.tag, v.k);
    }
  }
  return b;
}
function texto(pai, rotulo, ph, ajuda) { return campo(pai, rotulo, ph, { ph: true, alto: 88, ajuda }); }
function painel(pai, kicker, titulo, o) {
  o = o || {};
  const p = cartao(pai, { w: 360, topo: true, gap: 16 });
  p.name = 'Painel lateral · ' + titulo;
  const h = box(p, 'HORIZONTAL', { name: 'Cabeçalho do painel', gap: 12, w: 'FILL', align: 'MIN' });
  const l = box(h, 'VERTICAL', { name: 'Título', gap: 2, w: 'FILL' });
  T(l, kicker, { size: 12, cor: G.tx2, fill: true, lh: 18 });
  T(l, titulo, { font: F.sb, size: 18, fill: true, lh: 26 });
  if (o.tag) tag(h, o.tag[0], o.tag[1]); else ICO.fechar(h);
  return p;
}
function acoes(pai, sec, pri) {
  const a = box(pai, 'HORIZONTAL', { name: 'Ações', gap: 12, w: 'FILL', justify: 'MAX', align: 'CENTER' });
  botao(a, sec, 'secundario'); botao(a, pri, 'primario');
  return a;
}
function rotulo(pai, s) { return T(pai, s, { font: F.sb, size: 14, lh: 20 }); }
function duasCol(pai, CW, larguraDir) {
  const r = box(pai, 'HORIZONTAL', { name: 'Duas colunas', gap: 24, w: 'FILL', align: 'MIN' });
  const lw = CW - (larguraDir || 360) - 24;
  return { r, lw };
}

