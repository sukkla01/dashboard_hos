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
import { dbTypeLabel } from "@/lib/db/config";
import { checkDbHealth } from "@/lib/db/health";

const stats: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  iconBg: string;
  iconColor: string;
  icon: LucideIcon;
}[] = [
  {
    label: "ผู้ป่วยวันนี้",
    value: "128",
    change: "+12%",
    positive: true,
    iconBg: "bg-primary-500/15",
    iconColor: "text-primary-600 dark:text-primary-400",
    icon: Users,
  },
  {
    label: "นัดหมาย",
    value: "45",
    change: "+5%",
    positive: true,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
    icon: CalendarDays,
  },
  {
    label: "เตียงว่าง",
    value: "23",
    change: "-3%",
    positive: false,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    icon: BedDouble,
  },
  {
    label: "บุคลากร",
    value: "89",
    change: "0%",
    positive: true,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: Stethoscope,
  },
];

const recentActivities = [
  { time: "09:30", text: "ลงทะเบียนผู้ป่วยใหม่ HN 680001234" },
  { time: "10:15", text: "นัดหมายตรวจผู้ป่วยนอก 15 ราย" },
  { time: "11:00", text: "รายงานสรุปยอดผู้ป่วยประจำวัน" },
  { time: "13:45", text: "อัปเดตข้อมูลเตียง ICU คงเหลือ 3 เตียง" },
];

/** Mock OPD รายวัน — แทนที่ด้วย query ovst เมื่อเชื่อม DB แล้ว */
const weeklyOpd = [
  { day: "จ", label: "จันทร์", count: 98 },
  { day: "อ", label: "อังคาร", count: 112 },
  { day: "พ", label: "พุธ", count: 105 },
  { day: "พฤ", label: "พฤหัส", count: 128 },
  { day: "ศ", label: "ศุกร์", count: 142 },
  { day: "ส", label: "เสาร์", count: 85 },
  { day: "อา", label: "อาทิตย์", count: 52 },
];

const weeklyTotal = weeklyOpd.reduce((sum, d) => sum + d.count, 0);
const weeklyAvg = Math.round(weeklyTotal / weeklyOpd.length);
const weeklyPeak = weeklyOpd.reduce((max, d) => (d.count > max.count ? d : max));
const weeklyChange = "+8.2%";

export default async function DashboardPage() {
  const dbHealth = await checkDbHealth();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.positive ? TrendingUp : TrendingDown;

          return (
            <div key={stat.label} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={2} />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${stat.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
                >
                  <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {stat.change}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                ภาพรวมผู้ป่วยรายสัปดาห์
              </h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  {weeklyTotal.toLocaleString("th-TH")}
                </p>
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                  {weeklyChange} จากสัปดาห์ก่อน
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                เฉลี่ย {weeklyAvg.toLocaleString("th-TH")} ราย/วัน · สูงสุด {weeklyPeak.label}{" "}
                {weeklyPeak.count.toLocaleString("th-TH")} ราย
              </p>
            </div>
            <span className="glass-input rounded-lg px-3 py-1.5 text-xs text-muted">
              สัปดาห์นี้
            </span>
          </div>

          <WeeklyOpdChart data={weeklyOpd} />
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">สถานะฐานข้อมูล</h2>
          <p className="mb-4 text-sm text-muted">การเชื่อมต่อระบบ</p>
          <div className="space-y-3">
            {!dbHealth ? (
              <p className="text-sm text-muted">ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล HosXP</p>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-primary-500/8 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    HosXP — {dbTypeLabel(dbHealth.type)}
                  </p>
                  <p className="text-xs text-muted">ฐานข้อมูลหลัก ({dbHealth.type === "mysql" ? "my" : "pg"})</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    dbHealth.online
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}
                >
                  {dbHealth.online ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="mb-1 text-base font-semibold text-foreground">กิจกรรมล่าสุด</h2>
        <p className="mb-4 text-sm text-muted">เหตุการณ์ในระบบวันนี้</p>
        <div className="divide-y divide-[var(--divider)]">
          {recentActivities.map((activity) => (
            <div key={activity.time} className="flex gap-4 py-3">
              <span className="shrink-0 text-sm font-medium text-primary-600 dark:text-primary-400">
                {activity.time}
              </span>
              <span className="text-sm text-muted">{activity.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
