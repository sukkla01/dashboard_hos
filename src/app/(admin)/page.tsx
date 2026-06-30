import {
  BedDouble,
  CalendarDays,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import WeeklyOpdChart from "@/components/admin/WeeklyOpdChart";
import ReferInOutPanel from "@/components/admin/ReferInOutPanel";
import { dbTypeLabel } from "@/lib/db/config";
import { parseDateRange } from "@/lib/date";
import { checkDbHealth } from "@/lib/db/health";
import {
  getAppointmentTodayStats,
  getAvailableBedStats,
  getOpdTodayStats,
  getTopOpdDiagnoses,
  getStaffStats,
  getWeeklyOpdSummary,
  type DashboardStat,
} from "@/lib/queries/dashboard";
import { getReferInOutData } from "@/lib/queries/refer";

type StatCard = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  iconBg: string;
  iconColor: string;
  icon: LucideIcon;
  cardClass?: string;
  labelClass?: string;
  valueClass?: string;
};

function statValue(stat: DashboardStat | null): string {
  return stat ? stat.count.toLocaleString("th-TH") : "—";
}

function buildStats(
  opdToday: DashboardStat | null,
  appointments: DashboardStat | null,
  beds: DashboardStat | null,
  staff: DashboardStat | null,
): StatCard[] {
  return [
    {
      label: "ผู้ป่วยวันนี้xxxxx",
      value: statValue(opdToday),
      change: opdToday?.change ?? "—",
      positive: opdToday?.positive ?? true,
      iconBg: "bg-white/25",
      iconColor: "text-white",
      icon: Users,
      cardClass: "!border-red-600 !bg-red-500 shadow-lg shadow-red-500/30",
      labelClass: "text-white/90",
      valueClass: "text-white",
    },
    {
      label: "นัดหมาย",
      value: statValue(appointments),
      change: appointments?.change ?? "—",
      positive: appointments?.positive ?? true,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-600 dark:text-red-400",
      icon: CalendarDays,
    },
    {
      label: "เตียงว่าง",
      value: statValue(beds),
      change: beds?.change ?? "—",
      positive: beds?.positive ?? true,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      icon: BedDouble,
    },
    {
      label: "บุคลากร",
      value: statValue(staff),
      change: staff?.change ?? "—",
      positive: staff?.positive ?? true,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      icon: Stethoscope,
    },
  ];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ referFrom?: string; referTo?: string }>;
}) {
  const { referFrom, referTo } = await searchParams;
  const { from: referFromDate, to: referToDate } = parseDateRange(referFrom, referTo);

  const [dbHealth, opdToday, appointments, beds, staff, weeklyOpd, topDiagnoses, referData] =
    await Promise.all([
      checkDbHealth(),
      getOpdTodayStats(),
      getAppointmentTodayStats(),
      getAvailableBedStats(),
      getStaffStats(),
      getWeeklyOpdSummary(),
      getTopOpdDiagnoses(),
      getReferInOutData(referFromDate, referToDate),
    ]);

  const stats = buildStats(opdToday, appointments, beds, staff);

  return (
    <div className="space-y-6">
      <div className="horizon-hero relative mt-4 overflow-hidden px-6 pb-8 pt-5 sm:px-10 sm:pb-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="relative max-w-xl">
          <nav className="text-sm text-white/70">
            <span>หน้าหลัก</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">แดชบอร์ด</span>
          </nav>
          <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
            จัดการข้อมูลผู้ป่วยและบริการโรงพยาบาลอย่างมีประสิทธิภาพ
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            ติดตามผู้ป่วยนอก นัดหมาย และสถานะระบบ HosXP ได้ในที่เดียว
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.positive ? TrendingUp : TrendingDown;

          return (
            <div key={stat.label} className={`glass-card p-5 ${stat.cardClass ?? ""}`}>
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={2} />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold ${
                    stat.cardClass
                      ? "text-white"
                      : stat.positive
                        ? "text-emerald-500"
                        : "text-red-500"
                  }`}
                >
                  <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {stat.change}
                </span>
              </div>
              <p className={`mt-4 text-sm font-medium text-muted ${stat.labelClass ?? ""}`}>{stat.label}</p>
              <p className={`mt-1 text-3xl font-bold text-foreground ${stat.valueClass ?? ""}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">ภาพรวมผู้ป่วยรายสัปดาห์</h2>
              {weeklyOpd ? (
                <>
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <p className="text-3xl font-bold text-foreground">
                      {weeklyOpd.total.toLocaleString("th-TH")}
                    </p>
                    <span
                      className={`flex items-center gap-1 text-sm font-bold ${
                        weeklyOpd.positive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {weeklyOpd.positive ? (
                        <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
                      )}
                      {weeklyOpd.change} จากสัปดาห์ก่อน
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    เฉลี่ย {weeklyOpd.avg.toLocaleString("th-TH")} ราย/วัน · สูงสุด {weeklyOpd.peak.label}{" "}
                    {weeklyOpd.peak.count.toLocaleString("th-TH")} ราย
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">ไม่สามารถโหลดข้อมูลกราฟได้</p>
              )}
            </div>
            <span className="glass-input rounded-full px-4 py-1.5 text-xs font-medium text-muted">
              สัปดาห์นี้
            </span>
          </div>

          {weeklyOpd ? (
            <WeeklyOpdChart data={weeklyOpd.data} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted">
              ไม่พบข้อมูลผู้ป่วยนอก 7 วันล่าสุด
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-foreground">สถานะฐานข้อมูล</h2>
          <p className="mb-4 text-sm text-muted">การเชื่อมต่อระบบ</p>
          <div className="space-y-3">
            {!dbHealth ? (
              <p className="text-sm text-muted">ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล HosXP</p>
            ) : (
              <div className="flex items-center justify-between rounded-2xl bg-[var(--input-bg)] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    HosXP — {dbTypeLabel(dbHealth.type)}
                  </p>
                  <p className="text-xs text-muted">ฐานข้อมูลหลัก ({dbHealth.type === "mysql" ? "my" : "pg"})</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    dbHealth.online
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {dbHealth.online ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden p-6">
        <h2 className="text-lg font-bold text-foreground">10 อันดับโรคผู้ป่วยนอก</h2>
        <p className="mb-4 text-sm text-muted">วินิจฉัยหลัก (ICD-10) วันนี้</p>
        {!topDiagnoses || topDiagnoses.length === 0 ? (
          <p className="py-3 text-sm text-muted">ไม่พบข้อมูลวินิจฉัยวันนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--divider)] text-left text-xs font-semibold text-muted">
                  <th className="pb-3 pr-4 w-12">#</th>
                  <th className="pb-3 pr-4 w-24">รหัส</th>
                  <th className="pb-3 pr-4">ชื่อโรค</th>
                  <th className="pb-3 text-right w-24">จำนวน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {topDiagnoses.map((item) => (
                  <tr key={item.icd10} className="hover:bg-primary-50/50">
                    <td className="py-3 pr-4 font-bold text-primary-500">{item.rank}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted">{item.icd10}</td>
                    <td className="py-3 pr-4 text-foreground">{item.name}</td>
                    <td className="py-3 text-right font-semibold text-foreground">
                      {item.count.toLocaleString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReferInOutPanel from={referFromDate} to={referToDate} data={referData} />
    </div>
  );
}
