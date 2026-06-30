import { Suspense } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import ReferDateRangePicker from "@/components/admin/ReferDateRangePicker";
import { formatReferDateRange, type ReferInOutData } from "@/lib/queries/refer";
import { formatThaiDate } from "@/lib/format";

type ReferInOutPanelProps = {
  from: string;
  to: string;
  data: ReferInOutData;
};

export default function ReferInOutPanel({ from, to, data }: ReferInOutPanelProps) {
  return (
    <div className="glass-card overflow-hidden p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Refer In / Out</h2>
          <p className="mt-1 text-sm text-muted">
            การรับส่งต่อผู้ป่วย · {formatReferDateRange(from, to)}
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex gap-2">
              <div className="glass-input h-10 w-36 animate-pulse rounded-xl" />
              <div className="glass-input h-10 w-36 animate-pulse rounded-xl" />
            </div>
          }
        >
          <ReferDateRangePicker fromDefault={from} toDefault={to} />
        </Suspense>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="h-4 w-4" strokeWidth={2.5} />
            Refer In
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {data.summary.referIn.toLocaleString("th-TH")}
          </p>
          <p className="mt-1 text-xs text-muted">รับส่งต่อเข้า</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            Refer Out
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {data.summary.referOut.toLocaleString("th-TH")}
          </p>
          <p className="mt-1 text-xs text-muted">ส่งต่อออก</p>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="py-3 text-sm text-muted">ไม่พบรายการ Refer ในช่วงวันที่เลือก</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--divider)] text-left text-xs font-semibold text-muted">
                <th className="pb-3 pr-4 w-24">ประเภท</th>
                <th className="pb-3 pr-4 w-28">วันที่</th>
                <th className="pb-3 pr-4 w-24">HN</th>
                <th className="pb-3 pr-4">ชื่อผู้ป่วย</th>
                <th className="pb-3 pr-4">สถานบริการ</th>
                <th className="pb-3 pr-4 w-20">เวลา</th>
                <th className="pb-3 pr-4 w-20">สาเหตุ</th>
                <th className="pb-3">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider)]">
              {data.items.map((item, index) => (
                <tr
                  key={`${item.direction}-${item.hn}-${item.referDate}-${index}`}
                  className="hover:bg-primary-50/50"
                >
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        item.direction === "in"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.directionLabel}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{formatThaiDate(item.referDate)}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted">{item.hn}</td>
                  <td className="py-3 pr-4 text-foreground">{item.patientName}</td>
                  <td className="py-3 pr-4 text-foreground">{item.hospitalName}</td>
                  <td className="py-3 pr-4 text-muted">{item.referTime ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted">{item.referType ?? "—"}</td>
                  <td className="py-3 text-muted">{item.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
