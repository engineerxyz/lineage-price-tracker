import fs from 'fs';
import path from 'path';
import { DashboardClient } from '@/components/dashboard-client';

type Row = {
  ts?: string;
  kst?: string;
  values?: {
    deporozu?: number;
    jowoo?: number;
  };
};

function loadHistory(): Row[] {
  const p = path.join(process.cwd(), 'data', 'history.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Row[];
}

function extract(rows: Row[], key: 'deporozu' | 'jowoo') {
  const points = rows
    .map((r) => ({ t: r.kst || r.ts || '', v: r.values?.[key] }))
    .filter((x): x is { t: string; v: number } => typeof x.v === 'number');
  return {
    latest: points.at(-1)?.v,
    updated: points.at(-1)?.t,
    values: points.map((p) => p.v),
  };
}

export default function Page() {
  const rows = loadHistory();
  const deporozu = extract(rows, 'deporozu');
  const jowoo = extract(rows, 'jowoo');

  return <DashboardClient deporozu={deporozu} jowoo={jowoo} />;
}
