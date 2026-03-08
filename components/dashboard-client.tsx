"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PriceValue } from "@/components/price-value";

type ServerKey = "deporozu" | "jowoo";

export function DashboardClient({
  deporozu,
  jowoo,
}: {
  deporozu: { latest?: number; updated?: string; values: number[] };
  jowoo: { latest?: number; updated?: string; values: number[] };
}) {
  const [tab, setTab] = useState<ServerKey>("deporozu");
  const cur = tab === "deporozu" ? deporozu : jowoo;

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">리니지클래식 아덴 시세</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab("deporozu")} className={tab === "deporozu" ? activeBtn : idleBtn}>데포로쥬</button>
        <button onClick={() => setTab("jowoo")} className={tab === "jowoo" ? activeBtn : idleBtn}>조우</button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">현재값</CardTitle>
          <CardDescription className="text-5xl font-bold text-foreground">
            <PriceValue value={cur.latest} />
          </CardDescription>
          <p className="text-xs text-muted-foreground">업데이트: {cur.updated ? cur.updated.replace("T", " ") : "-"}</p>
        </CardHeader>
        <CardContent>
          <Sparkline values={cur.values} />
        </CardContent>
      </Card>
    </main>
  );
}

const activeBtn = "inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground";
const idleBtn = "inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground";

function Sparkline({ values }: { values: number[] }) {
  const pathData = useMemo(() => {
    if (!values.length) return null;
    const w = 1000, h = 240, p = 16;
    const min = Math.min(...values), max = Math.max(...values);
    const dx = (w - p * 2) / Math.max(1, values.length - 1);
    const y = (v: number) => (max === min ? h / 2 : h - p - ((v - min) / (max - min)) * (h - p * 2));
    const d = values.map((v, i) => `${i ? "L" : "M"} ${p + i * dx} ${y(v)}`).join(" ");
    return { d, w, h };
  }, [values]);

  if (!pathData) return <div className="text-sm text-muted-foreground">데이터 없음</div>;
  return (
    <svg viewBox={`0 0 ${pathData.w} ${pathData.h}`} role="img" aria-label="price trend" className="w-full">
      <path d={pathData.d} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
    </svg>
  );
}
