#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ITEMMANIA_URL = 'https://www.itemmania.com/sell/list_search.html?search_game=5913&search_server=24188';
const ITEMBAY_URL = 'https://www.itembay.com/item/sell/game-3828/server-15943/type-3';

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');
const LATEST_PATH = path.join(DATA_DIR, 'latest.json');
const DOCS_DATA_DIR = path.join(__dirname, 'docs', 'data');
const DOCS_HISTORY_PATH = path.join(DOCS_DATA_DIR, 'history.json');
const DOCS_LATEST_PATH = path.join(DOCS_DATA_DIR, 'latest.json');

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function statsFrom(values, trim = 0.05) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const cut = Math.floor(sorted.length * trim);
  const trimmed = sorted.slice(cut, sorted.length - cut);
  const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  return {
    n: sorted.length,
    cut,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: quantile(trimmed, 0.5),
    trimmedMean: avg,
    q1: quantile(trimmed, 0.25),
    q3: quantile(trimmed, 0.75),
    p10: quantile(trimmed, 0.10),
    p90: quantile(trimmed, 0.90),
  };
}

function extractItemmania(html) {
  const values10k = [];
  const re = /10만당\s*([\d,]+)원/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const v = Number(m[1].replace(/,/g, ''));
    if (!Number.isFinite(v)) continue;
    if (v < 30000 || v > 100000) continue; // filter non-aden rows/outliers
    values10k.push(v / 10); // convert to 1만당
  }
  return values10k;
}

function extractItembay(html) {
  const values10k = [];
  // Keep only chunks near money-unit rows likely to be aden/game-money.
  const rowLike = html.split(/<tr[\s>]/i).map((x) => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  for (const row of rowLike) {
    if (!/데포로쥬/.test(row)) continue;
    if (!/(아덴|아데나|게임머니)/.test(row)) continue;
    const m = row.match(/(?:단위\s*가격[^\d]*|\b)([\d,]{1,3}(?:,[\d]{3})*|\d{4,})원/);
    if (!m) continue;
    const v = Number(m[1].replace(/,/g, ''));
    if (!Number.isFinite(v)) continue;
    if (v < 3000 || v > 10000) continue; // 1만당 expected range
    values10k.push(v);
  }
  return values10k;
}

async function main() {
  const [r1, r2] = await Promise.all([
    fetch(ITEMMANIA_URL, { headers: { 'user-agent': 'Mozilla/5.0' } }),
    fetch(ITEMBAY_URL, { headers: { 'user-agent': 'Mozilla/5.0' } }),
  ]);

  const [h1, h2] = await Promise.all([r1.text(), r2.text()]);
  const im = extractItemmania(h1);
  const ib = extractItembay(h2);

  const point = {
    ts: new Date().toISOString(),
    kst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T'),
    unit: 'KRW per 10k Adena',
    itemmania: statsFrom(im),
    itembay: statsFrom(ib),
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  let history = [];
  if (fs.existsSync(HISTORY_PATH)) {
    history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  }
  history.push(point);
  if (history.length > 5000) history = history.slice(-5000);

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  fs.writeFileSync(LATEST_PATH, JSON.stringify(point, null, 2));

  fs.mkdirSync(DOCS_DATA_DIR, { recursive: true });
  fs.writeFileSync(DOCS_HISTORY_PATH, JSON.stringify(history, null, 2));
  fs.writeFileSync(DOCS_LATEST_PATH, JSON.stringify(point, null, 2));

  console.log(`[ok] ${point.kst} IM=${point.itemmania?.median ?? 'NA'} IB=${point.itembay?.median ?? 'NA'}`);
}

main().catch((e) => {
  console.error('[error]', e.message);
  process.exit(1);
});
