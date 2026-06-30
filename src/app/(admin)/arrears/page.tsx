import PlaceholderPage from "@/components/admin/PlaceholderPage";
import { parseDateRange } from "@/lib/date";
import { checkDbHealth } from "@/lib/db/health";
import { formatThaiDateWithWeekday } from "@/lib/format";
import { DashboardStat, getAppointmentTodayStats, getAvailableBedStats, getOpdTodayStats, getStaffStats, getTopOpdDiagnoses, getWeeklyOpdSummary } from "@/lib/queries/dashboard";
import { getReferInOutData } from "@/lib/queries/refer";
import { BedDouble, CalendarDays, Icon, LucideIcon, Stethoscope, TrendingDown, TrendingUp, TrendingUpIcon, Users } from "lucide-react";

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

export default async function ArrearsPage({
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

    const todayLabel = formatThaiDateWithWeekday(new Date());
    return (
        <div className="space-y-6">
            <div className="horizon-hero relative mt-4 overflow-hidden px-6 pb-8 pt-5 sm:px-10 sm:pb-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
                <div className="relative max-w-xl">
                    <nav className="text-sm text-white/70">
                        <span>หน้าหลัก</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-white">ค้างชำระ</span>
                    </nav>
                    <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
                        สวัสดีวันนี้ {todayLabel}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                        ติดตามค้างชำระ ระบบ HosXP ได้ในที่เดียว
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
                                    className={`flex items-center gap-0.5 text-xs font-bold ${stat.cardClass
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
        </div>

    );
}
