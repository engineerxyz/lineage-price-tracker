import fs from 'fs';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PriceValue } from '@/components/price-value';

const SERVERS = {
  deporozu: { key: 'deporozu', label: '데포로쥬' },
  jowoo: { key: 'jowoo', label: '조우' },
} as const;

type ServerKey = keyof typeof SERVERS;

type Row = {
  ts?: string;
  kst?: string;
  values?: Partial<Record<ServerKey, number>>;
};

function loadHistory(): Row[] {
  const p = path.join(process.cwd(), 'data', 'history.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Row[];
}

function points(rows: Row[], server: ServerKey) {
  return rows
    .map((r) => ({ t: r.kst || r.ts || '', v: r.values?.[server] ?? null }))
    .filter((x): x is { t: string; v: number } => typeof x.v === 'number');
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return <div className="text-sm text-muted-foreground">데이터 없음</div>;
  }
  const w = 1000;
  const h = 240;
  const p = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const dx = (w - p * 2) / Math.max(1, values.length - 1);
  const y = (v: number) => (max === min ? h / 2 : h - p - ((v - min) / (max - min)) * (h - p * 2));
  const d = values.map((v, i) => `${i ? 'L' : 'M'} ${p + i * dx} ${y(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="price trend" className="w-full">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
    </svg>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ server?: string }>;
}) {
  const sp = await searchParams;
  const server = (sp.server === 'jowoo' ? 'jowoo' : 'deporozu') as ServerKey;

  const history = loadHistory();
  const ps = points(history, server);
  const values = ps.map((x) => x.v);
  const latest = values.at(-1);
  const updated = ps.at(-1)?.t;

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">리니지클래식 아덴 시세</h1>
        <p className="text-sm text-muted-foreground">1만 아덴당 · 5분 간격 수집</p>
      </div>

      <div className="flex gap-2">
        {(Object.keys(SERVERS) as ServerKey[]).map((k) => {
          const active = server === k;
          return (
            <a
              key={k}
              href={`/?server=${k}`}
              className={
                active
                  ? 'inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground'
                  : 'inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground'
              }
            >
              {SERVERS[k].label}
            </a>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">현재값</CardTitle>
          <CardDescription className="text-5xl font-bold text-foreground">
            <PriceValue value={latest} />
          </CardDescription>
          <p className="text-xs text-muted-foreground">업데이트: {updated ? updated.replace('T', ' ') : '-'}</p>
        </CardHeader>
        <CardContent>
          <Sparkline values={values} />
        </CardContent>
      </Card>
    </main>
  );
}
