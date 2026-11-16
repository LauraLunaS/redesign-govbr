// Utilitários comuns dos plugins gerados (cores, fontes, desenho, leitura de estilos).
const hex = (h) => { const n = parseInt(h.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
const C = {
  fundoMenu: hex('#16295A'), titulo: hex('#FFFFFF'), mq: hex('#B9C6EE'), verdeBadge: hex('#22B04B'),
  prancha: hex('#3F3F3F'), faixa: hex('#FFD36B'), kicker: hex('#FFD36B'), lead: hex('#D9D9D9'),
  spec: hex('#1E1E1E'), specTit: hex('#FFFFFF'), specTxt: hex('#D0D0D0'),
  rosa: hex('#EC4899'), verde: hex('#22C55E'), laranja: hex('#F28C1B'), branco: hex('#FFFFFF'), divisor: hex('#FFFFFF'),
};
const solid = (c, o) => [{ type: 'SOLID', color: c, opacity: o == null ? 1 : o }];

// ---------- fontes (Rawline, a fonte do DS GOV.BR; cai para Inter se não estiver instalada) ----------
let F = { r: { family: 'Inter', style: 'Regular' }, b: { family: 'Inter', style: 'Bold' }, sb: { family: 'Inter', style: 'Semi Bold' } };
let DISPONIVEIS = [];
const CACHE_FONTE = new Map();
const normEstilo = (st) => String(st).toLowerCase().replace(/[\s_-]/g, '');
const PESOS = ['thin', 'extralight', 'light', 'regular', 'medium', 'semibold', 'bold', 'extrabold', 'black'];
const pesoDe = (st) => { const n = normEstilo(st).replace('italic', '').replace('ultra', 'extra').replace('demi', 'semi').replace('heavy', 'black') || 'regular'; const i = PESOS.indexOf(n); return i < 0 ? 3 : i; };
// devolve uma fonte que dá para carregar: a própria, o mesmo estilo com outro nome
// ("Semi Bold" x "SemiBold"), o peso mais próximo da mesma família ou a fonte padrão
async function garantirFonte(fn) {
  const k = fn.family + '|' + fn.style;
  if (CACHE_FONTE.has(k)) return CACHE_FONTE.get(k);
  let ok = null;
  try { await figma.loadFontAsync(fn); ok = fn; } catch (e) {}
  if (!ok) {
    const fam = DISPONIVEIS.filter((f) => f.family === fn.family);
    const it = /italic/i.test(fn.style);
    let alt = fam.find((f) => normEstilo(f.style) === normEstilo(fn.style));
    if (!alt && fam.length) {
      const alvo = pesoDe(fn.style);
      alt = fam.filter((f) => /italic/i.test(f.style) === it).sort((a, b) => Math.abs(pesoDe(a.style) - alvo) - Math.abs(pesoDe(b.style) - alvo))[0] || fam[0];
    }
    if (!alt) alt = pesoDe(fn.style) >= 5 ? F.b : F.r;
    try { await figma.loadFontAsync(alt); ok = alt; } catch (e) { ok = F.r; }
  }
  CACHE_FONTE.set(k, ok);
  return ok;
}
// duplica a tela trocando, só na cópia, fontes que não dá para carregar
async function clonarSeguro(tela) {
  const c = tela.clone();
  const textos = c.type === 'TEXT' ? [c] : c.findAll((n) => n.type === 'TEXT');
  for (const t of textos) {
    let segs = [];
    try { segs = t.getStyledTextSegments(['fontName']); } catch (e) { continue; }
    for (const sg of segs) {
      const sub = await garantirFonte(sg.fontName);
      if (sub.family !== sg.fontName.family || sub.style !== sg.fontName.style) {
        try { t.setRangeFontName(sg.start, sg.end, sub); } catch (e) {}
      }
    }
  }
  return c;
}

async function prepararFontes() {
  const todas = await figma.listAvailableFontsAsync();
  DISPONIVEIS = todas.map((f) => f.fontName);
  const raw = todas.filter((f) => f.fontName.family === 'Rawline').map((f) => f.fontName.style);
  if (raw.length) {
    const pick = (re, def) => raw.find((s) => re.test(s)) || def;
    F = {
      r: { family: 'Rawline', style: pick(/^regular$/i, raw[0]) },
      b: { family: 'Rawline', style: pick(/^bold$/i, pick(/bold/i, raw[0])) },
      sb: { family: 'Rawline', style: pick(/semi\s*bold/i, pick(/bold/i, raw[0])) },
    };
  }
  for (const k of ['r', 'b', 'sb']) await figma.loadFontAsync(F[k]);
}

// ---------- utilitários de desenho ----------
function txt(pai, s, x, y, o) {
  o = o || {};
  const t = figma.createText();
  t.fontName = o.font || F.r; t.fontSize = o.size || 14; t.characters = s;
  t.fills = solid(o.cor || C.branco);
  if (o.lh) t.lineHeight = { unit: 'PIXELS', value: o.lh };
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); }
  if (o.name) t.name = o.name;
  pai.appendChild(t); t.x = x; t.y = y;
  return t;
}
// texto com trechos **negrito**
function txtRico(pai, s, x, y, o) {
  const partes = s.split('**'); let limpo = '', neg = [];
  partes.forEach((p, i) => { if (i % 2) neg.push([limpo.length, limpo.length + p.length]); limpo += p; });
  const t = txt(pai, limpo, x, y, o);
  for (const [a, b] of neg) if (b > a) t.setRangeFontName(a, b, F.b);
  return t;
}
function ret(pai, x, y, w, h, cor, o) {
  const r = figma.createRectangle(); r.resize(Math.max(1, w), Math.max(1, h)); r.fills = solid(cor, o && o.op);
  if (o && o.raio) r.cornerRadius = o.raio; if (o && o.name) r.name = o.name;
  pai.appendChild(r); r.x = x; r.y = y; return r;
}
function bola(pai, cx, cy, d, cor) { const e = figma.createEllipse(); e.resize(d, d); e.fills = solid(cor); pai.appendChild(e); e.x = cx - d / 2; e.y = cy - d / 2; return e; }
// caminho poligonal (pontos absolutos no pai)
function linha(pai, pts, cor, o) {
  o = o || {};
  const minX = Math.min(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1]));
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONE', data: pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0] - minX} ${p[1] - minY}`).join(' ') }];
  v.strokes = solid(cor); v.strokeWeight = o.peso || 1.5; v.fills = [];
  if (o.tracejado) v.dashPattern = [4, 4];
  v.name = o.name || 'Conector';
  pai.appendChild(v); v.x = minX; v.y = minY; return v;
}
function pilula(pai, s, x, y, alinhar) {
  const f = figma.createFrame(); f.name = 'Cota ' + s;
  f.layoutMode = 'HORIZONTAL'; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.paddingLeft = f.paddingRight = 8; f.paddingTop = f.paddingBottom = 4; f.cornerRadius = 4; f.fills = solid(C.rosa);
  const t = figma.createText(); t.fontName = F.b; t.fontSize = 13; t.characters = s; t.fills = solid(C.branco); f.appendChild(t);
  pai.appendChild(f);
  f.x = alinhar === 'dir' ? x - f.width : alinhar === 'centro' ? x - f.width / 2 : x;
  f.y = y - f.height / 2; return f;
}

// ---------- leitura da tela ----------
const par = (n) => Math.round(n);
const rel = (n, base) => { const a = n.absoluteBoundingBox, b = base.absoluteBoundingBox; return { x: a.x - b.x, y: a.y - b.y, w: a.width, h: a.height }; };
const visivel = (n, raiz) => { for (let p = n; p && p !== raiz.parent; p = p.parent) if (p.visible === false) return false; return true; };
const corHex = (paints) => {
  if (!Array.isArray(paints)) return '';
  const p = paints.find((x) => x.type === 'SOLID' && x.visible !== false); if (!p) return '';
  const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return ('#' + h(p.color.r) + h(p.color.g) + h(p.color.b)).toUpperCase();
};
const pesoNum = (style) => { const s = style.toLowerCase();
  return /thin/.test(s) ? 100 : /extra\s*light/.test(s) ? 200 : /light/.test(s) ? 300 : /semi\s*bold|demi/.test(s) ? 600 : /extra\s*bold/.test(s) ? 800 : /black|heavy/.test(s) ? 900 : /bold/.test(s) ? 700 : /medium/.test(s) ? 500 : 400; };

function estiloTexto(t) {
  let seg;
  try { seg = t.getStyledTextSegments(['fontName', 'fontSize', 'lineHeight', 'fills'])[0]; } catch (e) { return null; }
  if (!seg) return null;
  const lh = seg.lineHeight.unit === 'PIXELS' ? par(seg.lineHeight.value) + ' px'
    : seg.lineHeight.unit === 'PERCENT' ? par(seg.fontSize * seg.lineHeight.value / 100) + ' px' : 'auto';
  return { fam: seg.fontName.family, estilo: seg.fontName.style, peso: pesoNum(seg.fontName.style), tam: par(seg.fontSize), lh, cor: corHex(seg.fills) };
}

function ehCartao(n, W) {
  if (!('fills' in n) || !Array.isArray(n.fills)) return false;
  if (!['FRAME', 'INSTANCE', 'COMPONENT', 'RECTANGLE'].includes(n.type)) return false;
  const b = n.absoluteBoundingBox; if (!b || b.width < 160 || b.height < 56 || b.width > W * 0.92) return false;
  const p = n.fills.find((x) => x.type === 'SOLID' && x.visible !== false && (x.opacity == null || x.opacity > 0.9));
  if (!p || p.color.r < 0.98 || p.color.g < 0.98 || p.color.b < 0.98) return false;
  const raio = n.cornerRadius === figma.mixed ? 4 : (n.cornerRadius || 0);
  const sombra = Array.isArray(n.effects) && n.effects.some((e) => e.visible !== false && /SHADOW/.test(e.type));
  const borda = Array.isArray(n.strokes) && n.strokes.length > 0;
  return raio >= 4 && (sombra || borda || raio >= 6);
}

async function carregarFontesDe(no) {
  const vistos = new Set();
  for (const t of no.findAll((n) => n.type === 'TEXT')) {
    let segs = []; try { segs = t.getStyledTextSegments(['fontName']); } catch (e) {}
    for (const s of segs) { const k = s.fontName.family + '|' + s.fontName.style; if (vistos.has(k)) continue; vistos.add(k); try { await figma.loadFontAsync(s.fontName); } catch (e) {} }
  }
}

