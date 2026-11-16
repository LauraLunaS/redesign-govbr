#!/usr/bin/env node
// Captura das telas do site com Playwright: print em cada largura + resumo do conteúdo (textos, botões, campos, tabelas).
//
//   node capturar.mjs login     --base http://localhost:5173 [--estado .redesign-govbr/auth.json]
//        abre o navegador visível; a pessoa faz login e FECHA A ABA. A sessão é salva no arquivo de estado.
//   node capturar.mjs descobrir --base http://localhost:5173 [--estado ...] [--max 80] [--saida .redesign-govbr/rotas-descobertas.json]
//        navega pelos links internos a partir da página inicial e lista as rotas encontradas.
//   node capturar.mjs telas     --base http://localhost:5173 --rotas .redesign-govbr/rotas.json [--larguras 1280,1440,1920] [--estado ...] [--saida .redesign-govbr/capturas]
//        rotas.json: [{ "id": "consumidor-solicitacoes", "rota": "/consumidor/solicitacoes", "perfil": "consumidor" }, ...]
//
// O arquivo de estado contém a sessão do navegador: NUNCA o versione (já vai no .gitignore criado pelo agente).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

let chromium;
try { ({ chromium } = await import('playwright')); } catch (e) {
  console.error('Erro: Playwright não instalado. Rode: npm install --prefix "<pasta scripts do plugin>" && npx --prefix "<pasta scripts do plugin>" playwright install chromium');
  process.exit(1);
}

const argv = process.argv.slice(2);
const opt = {}; const pos = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(argv[i]); }
const cmd = pos[0];
const base = String(opt.base || '').replace(/\/$/, '');
if (!cmd || (!base && cmd !== 'referencias')) { console.error('uso: node capturar.mjs <login|descobrir|telas> --base http://localhost:PORTA [...]  |  node capturar.mjs referencias --urls https://www.gov.br/...,https://... [--larguras 1440] [--saida .redesign-govbr/contexto/govbr]'); process.exit(1); }
const estado = opt.estado || '.redesign-govbr/auth.json';
const temEstado = fs.existsSync(estado);

async function contexto(browser, largura) {
  return browser.newContext({ viewport: { width: largura || 1440, height: 900 }, storageState: temEstado ? estado : undefined, locale: 'pt-BR' });
}
async function esperar(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch (e) {}
  await page.waitForTimeout(600);
}

// resumo do que está visível: o agente usa isso para montar o spec SÓ com conteúdo que existe
async function resumir(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const pegar = (sel, f) => [...document.querySelectorAll(sel)].filter(vis).map(f).filter((x) => x && (typeof x !== 'string' || x.length));
    const rotuloDe = (el) => {
      if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return txt(l); }
      const p = el.closest('label'); if (p) return txt(p);
      return el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || '';
    };
    return {
      url: location.pathname + location.search,
      titulo: document.title,
      titulos: pegar('h1,h2,h3,h4', (e) => ({ nivel: e.tagName, texto: txt(e) })),
      breadcrumb: pegar('nav[aria-label*="breadcrumb" i] li, .br-breadcrumb li, [class*="breadcrumb" i] li', txt),
      menu: pegar('header nav a, nav[aria-label*="principal" i] a, [role="menubar"] [role="menuitem"]', txt).slice(0, 40),
      abas: pegar('[role="tab"]', (e) => ({ texto: txt(e), ativa: e.getAttribute('aria-selected') === 'true' })),
      botoes: [...new Set(pegar('button, [role="button"], input[type="submit"], a.btn, a.br-button', (e) => txt(e) || e.value || e.getAttribute('aria-label')))].slice(0, 60),
      links: [...new Set(pegar('main a[href], [role="main"] a[href]', txt))].slice(0, 60),
      campos: pegar('input:not([type="hidden"]), select, textarea', (e) => ({ tipo: e.tagName === 'SELECT' ? 'select' : e.tagName === 'TEXTAREA' ? 'textarea' : (e.type || 'text'), rotulo: rotuloDe(e), placeholder: e.getAttribute('placeholder') || '', obrigatorio: e.required || e.getAttribute('aria-required') === 'true', opcoes: e.tagName === 'SELECT' ? [...e.options].map((o) => o.text.trim()).slice(0, 20) : undefined })),
      tabelas: pegar('table', (t) => ({ colunas: [...t.querySelectorAll('thead th')].map(txt), linhas: [...t.querySelectorAll('tbody tr')].slice(0, 5).map((r) => [...r.querySelectorAll('td')].map(txt)), totalLinhas: t.querySelectorAll('tbody tr').length })),
      mensagens: pegar('[role="alert"], [role="status"], .br-message, [class*="alert" i]', txt).slice(0, 10),
      textos: pegar('main p, [role="main"] p', txt).slice(0, 30),
    };
  });
}

const browser = await chromium.launch({ headless: cmd !== 'login' });
try {
  if (cmd === 'login') {
    fs.mkdirSync(path.dirname(estado), { recursive: true });
    const ctx = await contexto(browser, 1440);
    const page = await ctx.newPage();
    await page.goto(base);
    console.log('Faça o login na janela do navegador. Quando terminar e estiver dentro do portal, FECHE A ABA (ou espere 10 minutos).');
    await Promise.race([new Promise((ok) => page.on('close', ok)), new Promise((ok) => setTimeout(ok, 10 * 60 * 1000))]);
    await ctx.storageState({ path: estado });
    console.log(JSON.stringify({ ok: true, estado, aviso: 'Este arquivo contém a sessão; não versione nem compartilhe.' }));
  } else if (cmd === 'descobrir') {
    const max = Number(opt.max || 80);
    const ctx = await contexto(browser, 1440);
    const page = await ctx.newPage();
    const origem = new URL(base).origin;
    const fila = ['/'], vistas = new Map();
    while (fila.length && vistas.size < max) {
      const r = fila.shift(); if (vistas.has(r)) continue;
      try { await page.goto(origem + r); await esperar(page); } catch (e) { vistas.set(r, { rota: r, erro: String(e.message).slice(0, 120) }); continue; }
      const final = new URL(page.url()); const rr = final.pathname + final.search;
      vistas.set(r, { rota: r, final: rr !== r ? rr : undefined, titulo: await page.title(), h1: await page.locator('h1').first().innerText().catch(() => '') });
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
      for (const h of hrefs) { try { const u = new URL(h); if (u.origin !== origem) continue; const p = u.pathname + (u.search || ''); if (!vistas.has(p) && !fila.includes(p) && !/\.(pdf|zip|png|jpg|csv|json)$/i.test(p) && !/logout|sair/i.test(p)) fila.push(p); } catch (e) {} }
    }
    const saida = opt.saida || '.redesign-govbr/rotas-descobertas.json';
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, JSON.stringify([...vistas.values()], null, 2));
    console.log(JSON.stringify({ ok: true, rotas: vistas.size, saida, pendentes: fila.length }));
  } else if (cmd === 'telas') {
    if (!opt.rotas) throw new Error('informe --rotas arquivo.json');
    const rotas = JSON.parse(fs.readFileSync(opt.rotas, 'utf8'));
    const larguras = String(opt.larguras || '1280,1440,1920').split(',').map(Number);
    const saida = opt.saida || '.redesign-govbr/capturas';
    fs.mkdirSync(saida, { recursive: true });
    const res = [];
    for (const W of larguras) {
      const ctx = await contexto(browser, W);
      const page = await ctx.newPage();
      for (const r of rotas) {
        const id = r.id || r.rota.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'inicio';
        try {
          await page.goto(base + r.rota); await esperar(page);
          const png = path.join(saida, `${id}-${W}.png`);
          await page.screenshot({ path: png, fullPage: true });
          if (W === larguras[0] || !fs.existsSync(path.join(saida, `${id}.json`))) fs.writeFileSync(path.join(saida, `${id}.json`), JSON.stringify(Object.assign({ id, rotaPedida: r.rota }, await resumir(page)), null, 2));
          res.push({ id, largura: W, png, urlFinal: new URL(page.url()).pathname });
        } catch (e) { res.push({ id, largura: W, erro: String(e.message).slice(0, 160) }); }
      }
      await ctx.close();
    }
    fs.writeFileSync(path.join(saida, '_indice.json'), JSON.stringify(res, null, 2));
    const redirecionadas = res.filter((x) => x.urlFinal && rotas.find((r) => (r.id || '') === x.id && r.rota.split('?')[0] !== x.urlFinal));
    console.log(JSON.stringify({ ok: true, capturas: res.filter((x) => x.png).length, erros: res.filter((x) => x.erro), redirecionadas: redirecionadas.map((x) => x.id + ' → ' + x.urlFinal), saida }, null, 2));
  } else if (cmd === 'referencias') {
    // páginas reais do domínio gov.br como referência visual (só leitura, sem login, sem clicar em nada)
    const urls = String(opt.urls || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!urls.length) throw new Error('informe --urls com páginas do domínio gov.br');
    const foraGov = urls.filter((u) => { try { const h = new URL(u).hostname; return !(h === 'gov.br' || h.endsWith('.gov.br')); } catch (e) { return true; } });
    if (foraGov.length) throw new Error('só são aceitas páginas do domínio gov.br: ' + foraGov.join(', '));
    const larguras = String(opt.larguras || '1440').split(',').map(Number);
    const saida = opt.saida || '.redesign-govbr/contexto/govbr';
    fs.mkdirSync(saida, { recursive: true });
    const res = [];
    for (const W of larguras) {
      const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, locale: 'pt-BR' });
      const page = await ctx.newPage();
      for (const u of urls) {
        const id = new URL(u).hostname.replace(/^www\./, '').replace(/\./g, '-') + new URL(u).pathname.replace(/[^\w]+/g, '-').replace(/-+$/, '');
        try {
          await page.goto(u, { timeout: 45000 }); await esperar(page);
          const png = path.join(saida, `${id}-${W}.png`);
          await page.screenshot({ path: png, fullPage: true, timeout: 45000 });
          if (W === larguras[0]) fs.writeFileSync(path.join(saida, `${id}.json`), JSON.stringify(Object.assign({ id, origem: u }, await resumir(page)), null, 2));
          res.push({ id, url: u, largura: W, png });
        } catch (e) { res.push({ id, url: u, largura: W, erro: String(e.message).slice(0, 160) }); }
      }
      await ctx.close();
    }
    fs.writeFileSync(path.join(saida, '_indice.json'), JSON.stringify(res, null, 2));
    console.log(JSON.stringify({ ok: true, capturas: res.filter((x) => x.png).length, erros: res.filter((x) => x.erro), saida }, null, 2));
  } else throw new Error('comando desconhecido: ' + cmd);
} catch (e) {
  console.error('Erro: ' + e.message); process.exitCode = 1;
} finally { await browser.close(); }
