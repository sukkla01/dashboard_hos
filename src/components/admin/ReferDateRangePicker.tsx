"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ReferDateRangePickerProps = {
  fromDefault: string;
  toDefault: string;
};

export default function ReferDateRangePicker({
  fromDefault,
  toDefault,
}: ReferDateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("referFrom") ?? fromDefault;
  const to = searchParams.get("referTo") ?? toDefault;

  function handleChange(field: "referFrom" | "referTo", value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(field, value);

    const nextFrom = field === "referFrom" ? value : (next.get("referFrom") ?? fromDefault);
    const nextTo = field === "referTo" ? value : (next.get("referTo") ?? toDefault);
    if (nextFrom > nextTo) {
      if (field === "referFrom") {
        next.set("referTo", value);
      } else {
        next.set("referFrom", value);
      }
    }

    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="shrink-0">ตั้งแต่</span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(event) => handleChange("referFrom", event.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-sm text-foreground"
          aria-label="วันที่เริ่มต้น Refer In/Out"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="shrink-0">ถึง</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(event) => handleChange("referTo", event.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-sm text-foreground"
          aria-label="วันที่สิ้นสุด Refer In/Out"
        />
      </label>
    </div>
  );
}
