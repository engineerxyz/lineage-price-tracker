#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ITEMBAY_URL = 'https://www.itembay.com/item/sell/game-3828/server-15943/type-3';

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');
const LATEST_PATH = path.join(DATA_DIR, 'latest.json');
const DOCS_DATA_DIR = path.join(__dirname, 'docs', 'data');
const DOCS_HISTORY_PATH = path.join(DOCS_DATA_DIR, 'history.json');
const DOCS_LATEST_PATH = path.join(DOCS_DATA_DIR, 'latest.json');

function extractItembay(html) {
  const values10k = [];
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

function computeSingleValue(values, trim = 0.05) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const cut = Math.floor(sorted.length * trim);
  const trimmed = sorted.slice(cut, sorted.length - cut);
  if (!trimmed.length) return null;

  // User-selected logic: after removing top/bottom 5%, use the lowest remaining value as the single tracked value.
  return {
    value: trimmed[0],
    n: sorted.length,
    cut,
  };
}

async function main() {
  const r = await fetch(ITEMBAY_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await r.text();
  const values = extractItembay(html);
  const picked = computeSingleValue(values);

  if (!picked) throw new Error('No valid prices parsed from ItemBay page.');

  const point = {
    ts: new Date().toISOString(),
    kst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T'),
    unit: 'KRW per 10k Adena',
    value: picked.value,
    source: 'itembay_deporoju',
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

  console.log(`[ok] ${point.kst} value=${point.value}`);
}

main().catch((e) => {
  console.error('[error]', e.message);
  process.exit(1);
});
