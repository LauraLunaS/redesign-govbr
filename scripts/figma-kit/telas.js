// Renderizador: transforma o SPEC (JSON) em telas DS GOV.BR editáveis (auto layout).
// Depende de base.js (hex, solid, F, prepararFontes) e ds-govbr.js (G, box, T, ICO, botao, campo, tag, ...).

const GRID_PADRAO = { 1280: { margem: 40 }, 1440: { margem: 120 }, 1920: { margem: 160 } };
const gridDe = (W) => {
  const g = (SPEC.grid && SPEC.grid[W]) || GRID_PADRAO[W] || { margem: Math.max(24, Math.round((W - 1200) / 2)) };
  return { margem: g.margem, cw: W - 2 * g.margem, colunas: g.colunas || 12, gutter: g.gutter || 24 };
};
const nomeSecao = (area, W) => SPEC.projeto + ' · ' + area + ' (DS GOV.BR · ' + W + ')';
const nomeTela = (t, W) => SPEC.projeto + ' – ' + t.area + ' · ' + t.ordem + ' · ' + t.nome + ' · ' + W;
const tryset = (fn) => { try { fn(); } catch (e) {} };

// ---------- ícones extras ----------
ICO.menu = (p, c) => vetor(p, 'M 0 1 L 18 1 M 0 7 L 18 7 M 0 13 L 18 13', 18, 14, c || G.azul, 'menu');
ICO.funil = (p, c) => vetor(p, 'M 0 0 L 14 0 L 8.5 6.5 L 8.5 12 L 5.5 13.5 L 5.5 6.5 Z', 14, 14, c || G.azul, 'filtro', 1.5);
ICO.ordenar = (p, c) => vetor(p, 'M 0 4 L 4 0 L 8 4 M 0 8 L 4 12 L 8 8', 8, 12, c || G.azul, 'ordenar', 1.5);
ICO.kebab = (p, c) => vetor(p, 'M 2 1 L 2 1.1 M 2 7 L 2 7.1 M 2 13 L 2 13.1', 4, 14, c || G.azul, 'mais opções', 3);
ICO.casa = (p, c) => vetor(p, 'M 1 7 L 7 1 L 13 7 M 3 5.5 L 3 13 L 11 13 L 11 5.5', 14, 14, c || G.azul, 'início', 1.5);
ICO.ok = (p, c) => vetor(p, 'M 0 5 L 4 9 L 12 0', 12, 9, c || G.ok, 'sucesso', 2);
ICO.upload = (p, c) => vetor(p, 'M 8 12 L 8 1 M 3 6 L 8 1 L 13 6 M 1 15 L 15 15', 16, 16, c || G.azul, 'enviar', 1.6);

// ---------- Font Awesome 5 Free (ícones oficiais do DS GOV.BR) ----------
// glifo como texto editável, centrado num quadro do tamanho do ícone; nome da camada = "Ícone · fa-<nome>"
function fa(pai, codigo, nome, tam, cor, estilo) {
  const q = box(pai, 'HORIZONTAL', { name: 'Ícone · fa-' + nome, w: Math.round(tam * 1.25), h: tam, align: 'CENTER', justify: 'CENTER' });
  const t = figma.createText();
  t.fontName = (estilo === 'regular' && FA.regular) || FA.solid;
  t.fontSize = tam; t.characters = String.fromCodePoint(codigo);
  t.fills = solid(cor || G.azul); t.lineHeight = { unit: 'PIXELS', value: tam };
  t.textAlignHorizontal = 'CENTER'; t.name = 'fa-' + nome;
  q.appendChild(t);
  return q;
}
// ícone do kit → [código, nome FA, tamanho, cor padrão, estilo]
const FA_ICONES = {
  chevBaixo: [0xf078, 'chevron-down', 12], chevDir: [0xf054, 'chevron-right', 12], chevEsq: [0xf053, 'chevron-left', 12],
  lupa: [0xf002, 'search', 16], cal: [0xf073, 'calendar-alt', 16, 'tx2', 'regular'], fechar: [0xf00d, 'times', 14],
  doc: [0xf15c, 'file-alt', 16, null, 'regular'], recarregar: [0xf2f1, 'sync-alt', 14], menu: [0xf0c9, 'bars', 18],
  funil: [0xf0b0, 'filter', 14], ordenar: [0xf0dc, 'sort', 14], kebab: [0xf142, 'ellipsis-v', 16], casa: [0xf015, 'home', 14],
  ok: [0xf00c, 'check', 12, 'ok'], upload: [0xf093, 'upload', 16],
};
function aplicarFontAwesome() {
  if (!FA) return;
  for (const [k, [cod, nome, tam, corPadrao, estilo]] of Object.entries(FA_ICONES)) {
    ICO[k] = (p, c) => fa(p, cod, nome, tam, c || (corPadrao ? G[corPadrao] : G.azul), estilo);
  }
}
// ícone de status (mensagens e erros de campo)
const FA_STATUS = { info: [0xf05a, 'info-circle'], aviso: [0xf071, 'exclamation-triangle'], erro: [0xf057, 'times-circle'], sucesso: [0xf058, 'check-circle'], campoErro: [0xf06a, 'exclamation-circle'] };
function iconeStatus(pai, tipo, cor, tam, letra, corLetra) {
  if (FA) { const [cod, nome] = FA_STATUS[tipo] || FA_STATUS.info; return fa(pai, cod, nome, tam, cor); }
  return selo(pai, letra, cor, corLetra || G.branco, tam);
}

// ---------- mensagens (info, aviso, erro, sucesso) ----------
const MSG = {
  info: { bg: hex('#D4E5FF'), ic: hex('#1351B4'), l: 'i' }, aviso: { bg: hex('#FFF5C2'), ic: hex('#FFCD07'), l: '!', tx: true },
  erro: { bg: hex('#FDE0DB'), ic: hex('#E52207'), l: '!' }, sucesso: { bg: hex('#E3F5E1'), ic: hex('#168821'), l: '✓' },
};
function mensagemGov(pai, b) {
  const k = MSG[b.nivel] || MSG.info;
  const m = box(pai, 'HORIZONTAL', { name: 'Mensagem · ' + (b.nivel || 'info'), bg: k.bg, pad: 16, gap: 12, w: 'FILL', align: 'MIN' });
  iconeStatus(m, MSG[b.nivel] ? b.nivel : 'info', k.ic, 20, k.l, k.tx ? G.tx : G.branco);
  const v = box(m, 'VERTICAL', { name: 'Texto', gap: 4, w: 'FILL' });
  if (b.titulo) T(v, b.titulo, { font: F.b, size: 14, lh: 20, fill: true });
  T(v, b.texto || '', { size: 14, fill: true, lh: 20, bold: b.negrito });
  if (b.link) link(m, b.link);
  return m;
}

// ---------- header e footer GOV.BR ----------
function cabecalhoGov(tela, margem) {
  const c = SPEC.cabecalho || {};
  const h = box(tela, 'VERTICAL', { name: 'Header GOV.BR', bg: G.branco, sombra: true, w: 'FILL', pad: [12, margem, 12, margem], gap: 12 });
  const l1 = box(h, 'HORIZONTAL', { name: 'Linha 1', w: 'FILL', align: 'CENTER', gap: 16 });
  if (c.logoGovBr !== false) T(l1, 'gov.br', { font: F.b, size: 24, cor: G.azul, lh: 32, name: 'Logo gov.br' });
  if (c.assinatura) { box(l1, 'HORIZONTAL', { name: 'Divisor', bg: G.linha, w: 1, h: 24 }); T(l1, c.assinatura, { size: 14, cor: G.tx2, name: 'Assinatura' }); }
  box(l1, 'HORIZONTAL', { name: 'Espaço', w: 'FILL' });
  for (const lk of c.links || []) link(l1, lk, { size: 14 });
  if (c.usuario) {
    const u = box(l1, 'HORIZONTAL', { name: 'Usuário', gap: 8, align: 'CENTER' });
    selo(u, (c.usuario.trim()[0] || 'U').toUpperCase(), G.azul, G.branco, 32);
    T(u, c.usuario, { font: F.sb, size: 14, cor: G.azul });
    ICO.chevBaixo(u);
  } else if (c.entrar !== false) botao(l1, c.entrar || 'Entrar', 'primario', { peq: true });
  const l2 = box(h, 'HORIZONTAL', { name: 'Linha 2', w: 'FILL', align: 'CENTER', gap: 16 });
  if (c.menuLateral !== false) ICO.menu(l2);
  T(l2, c.sistema || SPEC.projeto, { size: 20, cor: G.tx, lh: 28, name: 'Título do sistema' });
  box(l2, 'HORIZONTAL', { name: 'Espaço', w: 'FILL' });
  if (c.busca) campo(l2, null, c.busca, { ph: true, ico: 'lupa', w: 400 });
  if (c.menu && c.menu.length) {
    const m = box(h, 'HORIZONTAL', { name: 'Menu principal', w: 'FILL', gap: 32, align: 'CENTER' });
    for (const it of c.menu) {
      const nome = typeof it === 'string' ? it : it.nome;
      const at = nome === TELA_ATUAL.menu;
      const i = box(m, 'HORIZONTAL', { name: 'Item de menu · ' + nome + (at ? ' (ativo)' : ''), gap: 6, align: 'CENTER', pad: [4, 0, 6, 0] });
      if (at) { i.strokes = solid(G.azul); i.strokeTopWeight = 0; i.strokeLeftWeight = 0; i.strokeRightWeight = 0; i.strokeBottomWeight = 3; }
      T(i, nome, { font: at ? F.sb : F.r, size: 16, cor: at ? G.azul : G.tx });
      if (typeof it === 'object' && it.submenu) ICO.chevBaixo(i, at ? G.azul : G.tx2);
    }
  }
  return h;
}
function rodapeGov(tela, margem) {
  const r = SPEC.rodape || {};
  const f = box(tela, 'VERTICAL', { name: 'Footer GOV.BR', bg: G.azulEsc, w: 'FILL', pad: [40, margem, 40, margem], gap: 32 });
  T(f, r.logo || 'gov.br', { font: F.b, size: 28, cor: G.branco, name: 'Logo' });
  if (r.colunas && r.colunas.length) {
    const cols = box(f, 'HORIZONTAL', { name: 'Links', gap: 24, w: 'FILL', align: 'MIN' });
    for (const col of r.colunas) {
      const c = box(cols, 'VERTICAL', { name: 'Coluna · ' + col.titulo, gap: 12, w: 'FILL' });
      T(c, String(col.titulo).toUpperCase(), { font: F.b, size: 14, cor: G.branco });
      for (const l of col.links || []) T(c, l, { size: 14, cor: G.branco });
    }
  }
  if (r.texto) { box(f, 'HORIZONTAL', { name: 'Divisor', bg: hex('#4A5A7A'), w: 'FILL', h: 1 }); T(f, r.texto, { size: 12, cor: G.branco, fill: true }); }
  return f;
}
function breadcrumb(pai, itens) {
  const b = box(pai, 'HORIZONTAL', { name: 'Breadcrumb', gap: 8, align: 'CENTER' });
  ICO.casa(b);
  itens.forEach((s, i) => {
    ICO.chevDir(b, G.ph);
    if (i === itens.length - 1) T(b, s, { size: 14, cor: G.tx }); else link(b, s, { size: 14, font: F.r });
  });
  return b;
}

// ---------- controles pequenos ----------
function selectPeq(pai, valor) {
  const s = box(pai, 'HORIZONTAL', { name: 'Select', stroke: G.ph, r: 4, pad: [4, 8, 4, 12], gap: 8, align: 'CENTER', bg: G.branco });
  T(s, String(valor), { size: 14 }); ICO.chevBaixo(s); return s;
}
function divisorV(pai) { return box(pai, 'HORIZONTAL', { name: 'Divisor', bg: G.linha, w: 1, h: 24 }); }
function radioGov(pai, rotulo, marcado) {
  const r = box(pai, 'HORIZONTAL', { name: 'Radio · ' + rotulo + (marcado ? ' (marcado)' : ''), gap: 8, align: 'CENTER' });
  const e = figma.createEllipse(); e.resize(24, 24); e.fills = solid(G.branco); e.strokes = solid(marcado ? G.azul : G.linha); e.strokeWeight = marcado ? 7 : 1; e.name = 'Radio'; r.appendChild(e);
  T(r, rotulo, { size: 16 });
  return r;
}
function checkGov(pai, rotulo, marcado) {
  const r = box(pai, 'HORIZONTAL', { name: 'Checkbox · ' + rotulo + (marcado ? ' (marcado)' : ''), gap: 8, align: 'CENTER' });
  const q = box(r, 'HORIZONTAL', { name: 'Caixa', bg: marcado ? G.azul : G.branco, stroke: marcado ? G.azul : G.linha, r: 4, w: 24, h: 24, align: 'CENTER', justify: 'CENTER' });
  if (marcado) ICO.ok(q, G.branco);
  T(r, rotulo, { size: 16 });
  return r;
}

// ---------- tabela no padrão GOV.BR ----------
// b: { titulo, busca, colunas:[{t, peso, alinhar:'dir'}], linhas:[[célula...]], selecionada, ordenadaPor, selecao, total, paginacao:{exibir, intervalo, pagina}, vazio }
function tabelaGov(pai, b, cw) {
  const card = box(pai, 'VERTICAL', { name: 'Tabela · ' + (b.titulo || 'lista'), bg: G.branco, sombra: true, w: cw });
  if (b.titulo || b.busca !== false) {
    const h = box(card, 'HORIZONTAL', { name: 'Título da tabela', w: 'FILL', pad: [20, 24, 20, 24], gap: 16, align: 'CENTER' });
    T(h, b.titulo || '', { font: F.sb, size: 20, lh: 24, fill: true });
    if (b.busca !== false) ICO.lupa(h);
    ICO.kebab(h);
  }
  const cols = (b.colunas || []).map((c) => (typeof c === 'string' ? { t: c } : c));
  const sel = !!b.selecao;
  const larg = cw - (sel ? 56 : 0);
  const soma = cols.reduce((a, c) => a + (c.peso || 1), 0) || 1;
  const lw = cols.map((c) => Math.floor(((c.peso || 1) / soma) * larg));
  const t = box(card, 'VERTICAL', { name: 'Tabela', w: 'FILL' });
  const fazLinha = (cab, i) => {
    const r = box(t, 'HORIZONTAL', { name: cab ? 'Cabeçalho da tabela' : 'Linha', bg: cab ? hex('#F0F0F0') : (b.selecionada === i ? G.sel : G.branco), w: 'FILL', align: 'CENTER' });
    tryset(() => { r.minHeight = cab ? 56 : 64; });
    r.strokes = solid(G.linha); r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1;
    if (sel) { const c = box(r, 'HORIZONTAL', { name: 'Célula · seleção', w: 56, pad: [0, 16, 0, 16], align: 'CENTER' }); checkGov(c, '', b.selecionada === i && !cab).children[1].remove(); }
    return r;
  };
  const cab = fazLinha(true, -1);
  cols.forEach((c, i) => {
    const dir = c.alinhar === 'dir';
    const ordenada = b.ordenadaPor === c.t;
    const cel = box(cab, 'HORIZONTAL', { name: 'Célula · ' + c.t, w: lw[i], pad: [8, 16, 8, 16], gap: 8, align: 'CENTER', justify: dir ? 'MAX' : 'MIN', bg: ordenada ? hex('#DBE8FB') : null });
    tryset(() => { cel.layoutSizingVertical = 'FILL'; });
    const tx = T(cel, c.t, { font: F.sb, size: 14, cor: G.azul, lh: 20 });
    tryset(() => { tx.textAutoResize = 'HEIGHT'; tx.resize(Math.max(20, lw[i] - 32 - (c.ordenar === false ? 0 : 16)), tx.height); tx.textTruncation = 'ENDING'; tx.maxLines = 2; if (dir) tx.textAlignHorizontal = 'RIGHT'; });
    if (c.ordenar !== false) ICO.ordenar(cel);
  });
  const linhas = b.linhas || [];
  if (!linhas.length && b.vazio) {
    const r = box(t, 'VERTICAL', { name: 'Estado vazio', w: 'FILL', pad: 40, align: 'CENTER' });
    T(r, b.vazio, { size: 16, cor: G.tx2 });
  }
  linhas.forEach((l, li) => {
    const r = fazLinha(false, li);
    l.forEach((v, i) => {
      if (i >= cols.length) return;
      const dir = cols[i].alinhar === 'dir';
      const cel = box(r, 'VERTICAL', { name: 'Célula · ' + cols[i].t, w: lw[i], pad: [12, 16, 12, 16], gap: 2, align: dir ? 'MAX' : 'MIN' });
      celula(cel, v, lw[i] - 32, dir);
    });
  });
  if (b.total) { const r = fazLinha(false, -2); b.total.forEach((v, i) => { if (i < cols.length) { const cel = box(r, 'VERTICAL', { name: 'Célula · total', w: lw[i], pad: [12, 16, 12, 16], align: cols[i].alinhar === 'dir' ? 'MAX' : 'MIN' }); T(cel, v || '', { font: F.b, size: 14, lh: 20 }); } }); }
  if (b.paginacao !== false) paginacaoGov(card, b.paginacao || {}, linhas.length);
  return card;
}
function txtCel(pai, s, w, o) {
  const t = T(pai, s == null || s === '' ? '—' : String(s), Object.assign({ size: 14, lh: 20 }, o || {}));
  tryset(() => { t.textAutoResize = 'HEIGHT'; t.resize(Math.max(20, w), t.height); t.textTruncation = 'ENDING'; t.maxLines = (o && o.maxLines) || 1; if (o && o.dir) t.textAlignHorizontal = 'RIGHT'; });
  return t;
}
// célula: texto | {tag, tipo} | {linhas:[a,b]} | {link} | {botao} | {acoes:[...]} | {erro} | {texto, cor}
function celula(cel, v, w, dir) {
  if (v == null || typeof v !== 'object') return txtCel(cel, v, w, { dir });
  if (v.tag) { tag(cel, v.tag, v.tipo || v.k); if (v.nota) txtCel(cel, v.nota, w, { size: 12, cor: G.tx2, lh: 16, maxLines: 2 }); return; }
  if (v.linhas || v.l) { const ls = v.linhas || v.l; txtCel(cel, ls[0], w, { font: v.forte === false ? F.r : F.sb, dir }); for (const x of ls.slice(1)) txtCel(cel, x, w, { size: 12, cor: G.tx2, lh: 16, dir }); return; }
  if (v.link) return link(cel, v.link, { size: 14 });
  if (v.botao) return botao(cel, v.botao, v.tipo || 'secundario', { peq: true });
  if (v.acoes) { const a = box(cel, 'HORIZONTAL', { name: 'Ações', gap: 16, align: 'CENTER' }); for (const s of v.acoes) link(a, s, { size: 14 }); return a; }
  if (v.erro) return txtCel(cel, v.erro, w, { font: F.sb, cor: G.erro });
  return txtCel(cel, v.texto || v.t || '', w, { cor: v.cor ? hex(v.cor) : G.tx, dir });
}
function paginacaoGov(pai, p, n) {
  const r = box(pai, 'HORIZONTAL', { name: 'Paginação', w: 'FILL', pad: [12, 24, 12, 24], gap: 12, align: 'CENTER' });
  T(r, 'Exibir', { size: 14 }); selectPeq(r, p.exibir || 10); divisorV(r);
  T(r, p.intervalo || ('1–' + Math.max(1, n) + ' de ' + (p.total || Math.max(1, n)) + ' itens'), { size: 14 });
  box(r, 'HORIZONTAL', { name: 'Espaço', w: 'FILL' });
  T(r, 'Página', { size: 14 }); selectPeq(r, p.pagina || 1); divisorV(r);
  ICO.chevEsq(r, G.ph); ICO.chevDir(r);
  return r;
}

// ---------- busca + filtros ----------
// b: { busca:'placeholder', botaoFiltros:true, grupos:[{rotulo, opcoes:[...], marcada}], aberto:false, aplicados:['Status: Ativo'] }
function filtrosGov(pai, b, cw) {
  const w = box(pai, 'VERTICAL', { name: 'Busca e filtros', gap: 12, w: cw });
  const r = box(w, 'HORIZONTAL', { name: 'Filtros', w: 'FILL', gap: 16, align: 'CENTER' });
  if (b.busca) campo(r, null, b.busca, { ph: true, ico: 'lupa', w: Math.min(400, Math.round(cw * 0.45)) });
  box(r, 'HORIZONTAL', { name: 'Espaço', w: 'FILL' });
  const temGrupos = b.grupos && b.grupos.length;
  if (temGrupos || b.botaoFiltros) { const bt = botao(r, 'Filtros', 'secundario', { icone: 'funil' }); bt.name = 'Botão · Filtros'; }
  for (const a of b.acoes || []) botao(r, a.texto || a, a.tipo || 'primario');
  if (b.aplicados && b.aplicados.length) {
    const c = box(w, 'HORIZONTAL', { name: 'Filtros aplicados', gap: 8, align: 'CENTER' });
    for (const s of b.aplicados) { const t = box(c, 'HORIZONTAL', { name: 'Filtro aplicado · ' + s, bg: G.azulClaro, r: 100, pad: [4, 12, 4, 12], gap: 8, align: 'CENTER' }); T(t, s, { size: 14, cor: G.azul }); ICO.fechar(t); }
    link(c, 'Limpar filtros', { size: 14 });
  }
  if (temGrupos && b.aberto) {
    const p = box(w, 'VERTICAL', { name: 'Filtros · painel aberto', bg: G.branco, sombra: true, pad: [16, 24, 16, 24], gap: 16, w: 317 });
    tryset(() => { p.layoutPositioning = 'ABSOLUTE'; p.x = cw - 317; p.y = 52; });
    b.grupos.forEach((g, gi) => {
      if (gi) box(p, 'HORIZONTAL', { name: 'Divisor', bg: hex('#888888'), w: 'FILL', h: 1 });
      const gr = box(p, 'VERTICAL', { name: 'Grupo · ' + g.rotulo, gap: 12, w: 'FILL' });
      T(gr, 'Filtrar por ' + g.rotulo, { font: F.b, size: 14, fill: true });
      for (const o of g.opcoes || []) (g.multipla ? checkGov : radioGov)(gr, o, o === g.marcada);
    });
    const f = box(p, 'HORIZONTAL', { name: 'Ações do filtro', gap: 16, w: 'FILL', justify: 'MAX', align: 'CENTER' });
    link(f, 'Limpar', { size: 16 }); botao(f, 'Aplicar', 'primario');
  }
  return w;
}

// ---------- formulário ----------
// b: { titulo, colunas:2, campos:[{rotulo, tipo, valor, placeholder, opcoes, obrigatorio, ajuda, erro, largura:'inteira'}], acoes:{primaria, secundaria} }
function formularioGov(pai, b, cw) {
  const f = box(pai, 'VERTICAL', { name: 'Formulário · ' + (b.titulo || ''), gap: 24, w: cw });
  if (b.titulo) T(f, b.titulo, { font: F.sb, size: 20, lh: 28 });
  if (b.descricao) T(f, b.descricao, { size: 14, cor: G.tx2, fill: true });
  const n = b.colunas || 1;
  let linha = null, nl = 0;
  for (const c of b.campos || []) {
    const inteira = c.largura === 'inteira' || ['radio', 'checkbox', 'textarea'].includes(c.tipo) || n === 1;
    if (inteira || !linha || nl >= n) { linha = box(f, 'HORIZONTAL', { name: 'Linha de campos', gap: 24, w: 'FILL', align: 'MIN' }); nl = 0; }
    campoGov(linha, c);
    nl = inteira ? n : nl + 1;
  }
  if (b.acoes) {
    const a = box(f, 'HORIZONTAL', { name: 'Ações', gap: 16, w: 'FILL', justify: 'MAX', align: 'CENTER' });
    if (b.acoes.terciaria) botao(a, b.acoes.terciaria, 'terciario');
    if (b.acoes.secundaria) botao(a, b.acoes.secundaria, 'secundario');
    if (b.acoes.primaria) botao(a, b.acoes.primaria, 'primario');
  }
  return f;
}
function campoGov(pai, c) {
  const rot = c.rotulo ? c.rotulo + (c.obrigatorio ? ' *' : '') : null;
  if (c.tipo === 'radio' || c.tipo === 'checkbox') {
    const g = box(pai, 'VERTICAL', { name: 'Campo · ' + c.rotulo, gap: 12, w: 'FILL' });
    if (rot) T(g, rot, { font: F.sb, size: 14, lh: 20 });
    const o = box(g, c.horizontal ? 'HORIZONTAL' : 'VERTICAL', { name: 'Opções', gap: c.horizontal ? 24 : 12 });
    for (const x of c.opcoes || []) (c.tipo === 'radio' ? radioGov : checkGov)(o, x, Array.isArray(c.valor) ? c.valor.includes(x) : c.valor === x);
    if (c.ajuda) T(g, c.ajuda, { size: 12, cor: G.tx2 });
    return g;
  }
  const ph = !c.valor;
  const w = campo(pai, rot, c.valor || c.placeholder || '', { ph, ico: c.tipo === 'select' ? 'select' : c.tipo === 'data' ? 'cal' : c.tipo === 'busca' ? 'lupa' : null, alto: c.tipo === 'textarea' ? 96 : null, ajuda: c.erro ? null : c.ajuda, prefixo: c.prefixo });
  if (c.erro) { const e = w.findOne((x) => x.name === 'Entrada'); if (e) e.strokes = solid(G.erro); const m = box(w, 'HORIZONTAL', { name: 'Erro', gap: 6, align: 'CENTER' }); iconeStatus(m, 'campoErro', G.erro, 14, '!'); T(m, c.erro, { size: 12, cor: G.erro }); }
  if (c.desabilitado) { const e = w.findOne((x) => x.name === 'Entrada'); if (e) { e.fills = solid(G.cab); e.opacity = 0.6; } }
  return w;
}

// ---------- outros blocos ----------
function cartoesGov(pai, b, cw) {
  const n = b.colunas || 3, gap = 24;
  const cwCard = Math.floor((cw - gap * (n - 1)) / n);
  const g = box(pai, 'VERTICAL', { name: 'Cartões', gap, w: cw });
  let linha = null;
  (b.itens || []).forEach((it, i) => {
    if (i % n === 0) linha = box(g, 'HORIZONTAL', { name: 'Linha de cartões', gap, w: 'FILL', align: 'MIN' });
    const c = box(linha, 'VERTICAL', { name: 'Cartão · ' + (it.titulo || i + 1), bg: G.branco, sombra: true, pad: 24, gap: 12, w: cwCard });
    if (it.tag) tag(c, it.tag, it.tipoTag);
    if (it.rotulo) T(c, it.rotulo, { size: 12, cor: G.tx2, fill: true });
    if (it.titulo) T(c, it.titulo, { font: F.sb, size: 18, lh: 26, fill: true });
    if (it.valor) T(c, it.valor, { font: F.b, size: 28, lh: 36, cor: it.corValor ? hex(it.corValor) : G.tx });
    if (it.texto) T(c, it.texto, { size: 14, cor: G.tx2, fill: true });
    if (it.link) link(c, it.link);
    if (it.botao) botao(c, it.botao, it.tipoBotao || 'secundario', { peq: true });
  });
  return g;
}
function listaGov(pai, b, cw) {
  const c = box(pai, 'VERTICAL', { name: 'Lista · ' + (b.titulo || ''), bg: G.branco, sombra: true, w: cw });
  if (b.titulo) { const h = box(c, 'HORIZONTAL', { name: 'Título', pad: [16, 24, 16, 24], w: 'FILL' }); T(h, b.titulo, { font: F.sb, size: 18, lh: 26, fill: true }); }
  for (const it of b.itens || []) {
    const r = box(c, 'HORIZONTAL', { name: 'Item · ' + (it.titulo || it), pad: [16, 24, 16, 24], gap: 16, w: 'FILL', align: 'CENTER' });
    r.strokes = solid(G.linhaFina); r.strokeTopWeight = 1; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 0;
    const v = box(r, 'VERTICAL', { name: 'Texto', gap: 2, w: 'FILL' });
    T(v, typeof it === 'string' ? it : it.titulo, { font: F.sb, size: 14, fill: true });
    if (it.descricao) T(v, it.descricao, { size: 12, cor: G.tx2, fill: true });
    if (it.tag) tag(r, it.tag, it.tipoTag);
    if (it.link) link(r, it.link); else if (typeof it === 'object' && it.seta !== false) ICO.chevDir(r);
  }
  return c;
}
function kpisGov(pai, b, cw) {
  const n = (b.itens || []).length || 1, gap = 16;
  const r = box(pai, 'HORIZONTAL', { name: 'Indicadores', gap, w: cw });
  const w = Math.floor((cw - gap * (n - 1)) / n);
  for (const it of b.itens || []) kpi(r, w, it.rotulo, it.valor, it.sub, { ativo: it.ativo, ponto: it.tipo ? (TAG[it.tipo] || [])[0] : null, cor: it.tipo === 'erro' ? G.erro : null });
  return r;
}
function passosGov(pai, b, cw) {
  const r = box(pai, 'HORIZONTAL', { name: 'Passos', w: cw, align: 'MIN' });
  const n = (b.itens || []).length || 1, w = Math.floor(cw / n);
  (b.itens || []).forEach((s, i) => {
    const at = i === (b.ativo || 0), feito = i < (b.ativo || 0);
    const it = box(r, 'VERTICAL', { name: 'Passo · ' + s + (at ? ' (atual)' : ''), w, gap: 8, align: 'CENTER' });
    selo(it, feito ? '✓' : String(i + 1), at || feito ? G.azul : G.branco, at || feito ? G.branco : G.tx2, 32);
    if (!(at || feito)) { const s0 = it.children[0]; s0.strokes = solid(G.linha); s0.strokeWeight = 1; }
    T(it, s, { font: at ? F.sb : F.r, size: 14, cor: at ? G.azul : G.tx2 });
  });
  return r;
}
function acordeaoGov(pai, b, cw) {
  const c = box(pai, 'VERTICAL', { name: 'Acordeão', w: cw });
  (b.itens || []).forEach((it, i) => {
    const aberto = i === (b.aberto == null ? -1 : b.aberto);
    const r = box(c, 'VERTICAL', { name: 'Item · ' + it.titulo, w: 'FILL' });
    r.strokes = solid(G.linha); r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1;
    const h = box(r, 'HORIZONTAL', { name: 'Título', pad: [16, 16, 16, 16], gap: 12, w: 'FILL', align: 'CENTER' });
    T(h, it.titulo, { font: F.sb, size: 16, fill: true }); ICO.chevBaixo(h);
    if (aberto && it.texto) { const v = box(r, 'VERTICAL', { name: 'Conteúdo', pad: [0, 16, 16, 16], w: 'FILL' }); T(v, it.texto, { size: 14, cor: G.tx2, fill: true }); }
  });
  return c;
}
function vazioGov(pai, b, cw) {
  const v = box(pai, 'VERTICAL', { name: 'Estado vazio', w: cw, pad: 48, gap: 16, align: 'CENTER', bg: G.branco });
  T(v, b.titulo || b.texto || 'Nada por aqui', { font: F.sb, size: 18 });
  if (b.titulo && b.texto) T(v, b.texto, { size: 14, cor: G.tx2 });
  if (b.botao) botao(v, b.botao, 'primario');
  return v;
}
function uploadGov(pai, b, cw) {
  const u = box(pai, 'VERTICAL', { name: 'Upload', w: Math.min(cw, b.largura || cw), pad: 24, gap: 8, align: 'CENTER', bg: G.branco });
  u.strokes = solid(G.azul); u.strokeWeight = 1; u.dashPattern = [6, 4];
  const r = box(u, 'HORIZONTAL', { name: 'Texto', gap: 8, align: 'CENTER' }); ICO.upload(r); T(r, b.texto || 'Selecione o arquivo', { font: F.sb, size: 14, cor: G.azul });
  if (b.ajuda) T(u, b.ajuda, { size: 12, cor: G.tx2 });
  return u;
}

// ---------- despachante ----------
function bloco(pai, b, cw) {
  switch (b.tipo) {
    case 'abas': return abas(pai, b.itens || [], b.ativa, { nome: b.nome || 'Abas', peq: b.pequenas });
    case 'mensagem': return mensagemGov(pai, b);
    case 'kpis': return kpisGov(pai, b, cw);
    case 'filtros': return filtrosGov(pai, b, cw);
    case 'tabela': return tabelaGov(pai, b, cw);
    case 'formulario': return formularioGov(pai, b, cw);
    case 'cartoes': return cartoesGov(pai, b, cw);
    case 'lista': return listaGov(pai, b, cw);
    case 'passos': return passosGov(pai, b, cw);
    case 'acordeao': return acordeaoGov(pai, b, cw);
    case 'vazio': return vazioGov(pai, b, cw);
    case 'upload': return uploadGov(pai, b, cw);
    case 'resumo': return resumo(pai, (b.pares || []).map((p) => [p[0], typeof p[1] === 'object' && p[1] ? { tag: p[1].tag, k: p[1].tipo } : String(p[1])]));
    case 'texto': { const v = box(pai, 'VERTICAL', { name: 'Texto', gap: 8, w: cw }); if (b.titulo) T(v, b.titulo, { font: F.sb, size: 20, lh: 28, fill: true }); for (const p of [].concat(b.texto || [])) T(v, p, { size: b.tamanho || 16, cor: G.tx, fill: true, lh: 24 }); return v; }
    case 'acoes': { const a = box(pai, 'HORIZONTAL', { name: 'Ações', gap: 16, w: cw, justify: b.alinhar === 'esq' ? 'MIN' : 'MAX', align: 'CENTER' }); for (const x of b.itens || []) botao(a, x.texto || x, x.tipo || 'secundario'); return a; }
    case 'link': return link(pai, b.texto);
    case 'tags': { const a = box(pai, 'HORIZONTAL', { name: 'Tags', gap: 8, align: 'CENTER' }); for (const x of b.itens || []) tag(a, x.texto || x, x.tipo); return a; }
    case 'secao': case 'cartao': {
      const ehCard = b.tipo === 'cartao';
      const s = box(pai, 'VERTICAL', { name: (ehCard ? 'Cartão · ' : 'Seção · ') + (b.titulo || ''), gap: 16, w: cw, bg: ehCard ? G.branco : null, sombra: ehCard, pad: ehCard ? 24 : 0 });
      if (b.titulo || b.acao) {
        const h = box(s, 'HORIZONTAL', { name: 'Cabeçalho', gap: 16, w: 'FILL', align: 'CENTER' });
        const l = box(h, 'VERTICAL', { name: 'Título', gap: 4, w: 'FILL' });
        if (b.titulo) T(l, b.titulo, { font: F.sb, size: ehCard ? 18 : 20, lh: 28, fill: true });
        if (b.descricao) T(l, b.descricao, { size: 14, cor: G.tx2, fill: true });
        if (b.acao) botao(h, b.acao.texto || b.acao, b.acao.tipo || 'secundario', { peq: true });
      }
      const inner = cw - (ehCard ? 48 : 0);
      for (const x of b.blocos || []) bloco(s, x, inner);
      return s;
    }
    case 'painel': {
      const w = b.largura || 360;
      const p = box(pai, 'VERTICAL', { name: 'Painel lateral · ' + (b.titulo || ''), bg: G.branco, sombra: true, pad: 24, gap: 16, w });
      p.strokes = solid(G.azul); p.strokeTopWeight = 4; p.strokeLeftWeight = 0; p.strokeRightWeight = 0; p.strokeBottomWeight = 0;
      const h = box(p, 'HORIZONTAL', { name: 'Cabeçalho do painel', gap: 12, w: 'FILL', align: 'MIN' });
      const l = box(h, 'VERTICAL', { name: 'Título', gap: 2, w: 'FILL' });
      if (b.kicker) T(l, b.kicker, { size: 12, cor: G.tx2, fill: true });
      T(l, b.titulo || '', { font: F.sb, size: 18, lh: 26, fill: true });
      if (b.tag) tag(h, b.tag, b.tipoTag); else ICO.fechar(h);
      for (const x of b.blocos || []) bloco(p, x, w - 48);
      return p;
    }
    case 'duas-colunas': {
      const dw = b.larguraDireita || 360, gap = 24;
      const r = box(pai, 'HORIZONTAL', { name: 'Duas colunas', gap, w: cw, align: 'MIN' });
      const ew = cw - dw - gap;
      const e = box(r, 'VERTICAL', { name: 'Coluna principal', gap: 24, w: ew });
      for (const x of b.esquerda || []) bloco(e, x, ew);
      const d = box(r, 'VERTICAL', { name: 'Coluna lateral', gap: 24, w: dw });
      for (const x of b.direita || []) bloco(d, x, dw);
      return r;
    }
    default: {
      const v = box(pai, 'VERTICAL', { name: 'Bloco desconhecido · ' + b.tipo, w: cw, pad: 16, bg: G.avisoBg });
      T(v, 'Tipo de bloco não suportado: ' + b.tipo, { size: 14, fill: true });
      return v;
    }
  }
}

// ---------- tela inteira ----------
let TELA_ATUAL = {};
function montarTela(t, W) {
  TELA_ATUAL = t;
  const { margem, cw, colunas, gutter } = gridDe(W);
  const tela = figma.createFrame();
  tela.name = nomeTela(t, W);
  tela.layoutMode = 'VERTICAL'; tela.primaryAxisSizingMode = 'AUTO'; tela.counterAxisSizingMode = 'FIXED';
  tela.resize(W, 900); tela.fills = solid(G.cinza); tela.itemSpacing = 0; tela.clipsContent = true;
  tryset(() => { tela.minHeight = 900; });
  tryset(() => { tela.layoutGrids = [{ pattern: 'COLUMNS', alignment: 'STRETCH', count: colunas, gutterSize: gutter, offset: margem, visible: true, color: { r: 1, g: 0, b: 0, a: 0.06 } }]; });
  if (t.cabecalho !== false) cabecalhoGov(tela, margem);
  const c = box(tela, 'VERTICAL', { name: 'Conteúdo', w: 'FILL', pad: [24, margem, 64, margem], gap: 24 });
  tryset(() => { c.layoutGrow = 1; });
  if (t.breadcrumb && t.breadcrumb.length) breadcrumb(c, t.breadcrumb);
  if (t.titulo) {
    const h = box(c, 'VERTICAL', { name: 'Título da página', gap: 8, w: 'FILL' });
    T(h, t.titulo, { font: F.sb, size: 32, lh: 40, fill: true, name: 'Título' });
    if (t.descricao) T(h, t.descricao, { size: 16, cor: G.tx2, lh: 24, fill: true, name: 'Descrição' });
  }
  for (const b of t.blocos || []) bloco(c, b, cw);
  if (t.rodape !== false) rodapeGov(tela, margem);
  return tela;
}
