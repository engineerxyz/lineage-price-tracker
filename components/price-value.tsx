"use client";

import NumberFlow from "@number-flow/react";

export function PriceValue({ value }: { value?: number }) {
  if (typeof value !== "number") return <span>-</span>;

  return (
    <span className="inline-flex items-end gap-1">
      <NumberFlow
        value={value}
        format={{ useGrouping: true, maximumFractionDigits: 0 }}
        transformTiming={{ duration: 500, easing: "ease-out" }}
        spinTiming={{ duration: 500, easing: "ease-out" }}
        willChange
      />
      <span className="text-2xl font-semibold">원</span>
    </span>
  );
}
