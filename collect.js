#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SERVER_CONFIG = {
  deporozu: { url: 'https://www.itembay.com/item/sell/game-3828/server-15943/type-3' },
  jowoo: { url: 'https://www.itembay.com/item/sell/game-3828/server-15947/type-3' },
};

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');
const LATEST_PATH = path.join(DATA_DIR, 'latest.json');

function extractItembay(html) {
  const values10k = [];
  const rowLike = html.split(/<tr[\s>]/i).map((x) => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  for (const row of rowLike) {
    if (!/(아덴|아데나|게임머니)/.test(row)) continue;
    const m = row.match(/(?:단위\s*가격[^\d]*|\b)([\d,]{1,3}(?:,[\d]{3})*|\d{4,})원/);
    if (!m) continue;
    const v = Number(m[1].replace(/,/g, ''));
    if (!Number.isFinite(v)) continue;
    if (v < 3000 || v > 10000) continue;
    values10k.push(v);
  }
  return values10k;
}

function pickSingleValue(values, trim = 0.05) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const cut = Math.floor(sorted.length * trim);
  const trimmed = sorted.slice(cut, sorted.length - cut);
  if (!trimmed.length) return null;
  return trimmed[0]; // user-chosen single value logic
}

async function collectOne(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await res.text();
  return pickSingleValue(extractItembay(html));
}

async function main() {
  const keys = Object.keys(SERVER_CONFIG);
  const entries = await Promise.all(
    keys.map(async (k) => [k, await collectOne(SERVER_CONFIG[k].url)])
  );
  const values = Object.fromEntries(entries);

  const point = {
    ts: new Date().toISOString(),
    kst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T'),
    unit: 'KRW per 10k Adena',
    values,
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

  console.log(`[ok] ${point.kst} deporozu=${values.deporozu ?? 'NA'} jowoo=${values.jowoo ?? 'NA'}`);
}

main().catch((e) => {
  console.error('[error]', e.message);
  process.exit(1);
});
