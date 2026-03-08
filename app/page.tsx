import fs from 'fs';
import path from 'path';

const SERVERS = {
  deporozu: { key: 'deporozu', label: '데포로쥬' },
  jowoo: { key: 'jowoo', label: '조우' },
} as const;

type ServerKey = keyof typeof SERVERS;

function loadHistory() {
  const p = path.join(process.cwd(), 'data', 'history.json');
  if (!fs.existsSync(p)) return [] as any[];
  return JSON.parse(fs.readFileSync(p, 'utf8')) as any[];
}

function toPoints(rows: any[], server: ServerKey) {
  return rows
    .map((r) => ({ t: r.kst || r.ts, v: r.values?.[server] ?? null }))
    .filter((x) => typeof x.v === 'number');
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return <div className="muted">데이터 없음</div>;
  const w = 900, h = 220, p = 20;
  const min = Math.min(...values), max = Math.max(...values);
  const dx = (w - p * 2) / Math.max(1, values.length - 1);
  const scaleY = (v: number) => {
    if (max === min) return h / 2;
    return h - p - ((v - min) / (max - min)) * (h - p * 2);
  };
  const d = values.map((v, i) => `${i ? 'L' : 'M'} ${p + i * dx} ${scaleY(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="price trend">
      <path d={d} fill="none" stroke="#60a5fa" strokeWidth="3" />
    </svg>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ server?: string }> }) {
  const sp = await searchParams;
  const server = (sp.server === 'jowoo' ? 'jowoo' : 'deporozu') as ServerKey;

  const rows = loadHistory();
  const points = toPoints(rows, server);
  const values = points.map((p) => p.v as number);
  const latest = values.at(-1);
  const updated = points.at(-1)?.t;

  return (
    <main>
      <h2>리니지클래식 아덴 단일 지표 (1만 아덴당)</h2>
      <p className="muted">상/하위 5% 제거 후 최저값 · 5분 간격 수집</p>

      <div className="tabs">
        {(Object.keys(SERVERS) as ServerKey[]).map((k) => (
          <a key={k} href={`/?server=${k}`} className={`tab ${server === k ? 'active' : ''}`}>
            {SERVERS[k].label}
          </a>
        ))}
      </div>

      <div className="card">
        <div className="muted">현재값</div>
        <div className="big">{latest ? `${latest.toLocaleString()}원` : '-'}</div>
        <div className="muted">업데이트: {updated ? String(updated).replace('T', ' ') : '-'}</div>
        <div style={{ marginTop: 12 }}>
          <Sparkline values={values} />
        </div>
      </div>
    </main>
  );
}
