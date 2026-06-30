import { hosxpConfig, isDbConfigured } from "@/lib/db/config";
import { queryHosxp } from "@/lib/db/query";

type CountPairRow = {
  today: number;
  yesterday: number;
};

type BedStatsRow = {
  total_beds: number;
  admitted_now: number;
  admitted_yesterday: number;
};

type WeeklyCountRow = {
  day: string;
  count: number;
};

type WeekCompareRow = {
  this_week: number;
  prev_week: number;
};

type TopDiagnosisRow = {
  icd10: string;
  name: string | null;
  cnt: number;
};

export type DashboardStat = {
  count: number;
  change: string;
  positive: boolean;
};

export type WeeklyOpdPoint = {
  day: string;
  label: string;
  count: number;
};

export type WeeklyOpdSummary = {
  data: WeeklyOpdPoint[];
  total: number;
  avg: number;
  peak: WeeklyOpdPoint;
  change: string;
  positive: boolean;
};

export type TopOpdDiagnosis = {
  rank: number;
  icd10: string;
  name: string;
  count: number;
};

const THAI_DAYS: Record<number, { day: string; label: string }> = {
  0: { day: "อา", label: "อาทิตย์" },
  1: { day: "จ", label: "จันทร์" },
  2: { day: "อ", label: "อังคาร" },
  3: { day: "พ", label: "พุธ" },
  4: { day: "พฤ", label: "พฤหัส" },
  5: { day: "ศ", label: "ศุกร์" },
  6: { day: "ส", label: "เสาร์" },
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatChange(today: number, yesterday: number): Pick<DashboardStat, "change" | "positive"> {
  if (yesterday === 0) {
    if (today === 0) {
      return { change: "0%", positive: true };
    }
    return { change: "+100%", positive: true };
  }

  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  if (pct === 0) {
    return { change: "0%", positive: true };
  }

  const sign = pct > 0 ? "+" : "";
  return { change: `${sign}${pct}%`, positive: pct >= 0 };
}

function buildStat(count: number, yesterday: number): DashboardStat {
  const { change, positive } = formatChange(count, yesterday);
  return { count, change, positive };
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildLast7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  return days;
}

function toWeeklyPoints(rows: WeeklyCountRow[]): WeeklyOpdPoint[] {
  const countByDay = new Map(rows.map((row) => [String(row.day).slice(0, 10), toNumber(row.count)]));

  return buildLast7Days().map((date) => {
    const thai = THAI_DAYS[date.getDay()];
    return {
      day: thai.day,
      label: thai.label,
      count: countByDay.get(dateKey(date)) ?? 0,
    };
  });
}

const isPostgres = hosxpConfig.type === "postgres";

const opdTodaySql = isPostgres
  ? `
      SELECT
        COUNT(*) FILTER (WHERE vstdate = CURRENT_DATE)::int AS today,
        COUNT(*) FILTER (WHERE vstdate = CURRENT_DATE - INTERVAL '1 day')::int AS yesterday
      FROM ovst
      WHERE vstdate >= CURRENT_DATE - INTERVAL '1 day'
    `
  : `
      SELECT
        SUM(CASE WHEN vstdate = CURDATE() THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN vstdate = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS yesterday
      FROM ovst
      WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `;

const appointmentTodaySql = isPostgres
  ? `
      SELECT
        COUNT(*) FILTER (WHERE nextdate = CURRENT_DATE)::int AS today,
        COUNT(*) FILTER (WHERE nextdate = CURRENT_DATE - INTERVAL '1 day')::int AS yesterday
      FROM oapp
      WHERE nextdate >= CURRENT_DATE - INTERVAL '1 day'
    `
  : `
      SELECT
        SUM(CASE WHEN nextdate = CURDATE() THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN nextdate = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS yesterday
      FROM oapp
      WHERE nextdate >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `;

const bedStatsSql = isPostgres
  ? `
      SELECT
        (SELECT COALESCE(SUM(bedcount), 0)::int FROM ward) AS total_beds,
        (SELECT COUNT(*)::int FROM ipt WHERE dchdate IS NULL) AS admitted_now,
        (
          SELECT COUNT(*)::int FROM ipt
          WHERE regdate <= CURRENT_DATE - INTERVAL '1 day'
            AND (dchdate IS NULL OR dchdate > CURRENT_DATE - INTERVAL '1 day')
        ) AS admitted_yesterday
    `
  : `
      SELECT
        (SELECT COALESCE(SUM(bedcount), 0) FROM ward) AS total_beds,
        (SELECT COUNT(*) FROM ipt WHERE dchdate IS NULL) AS admitted_now,
        (
          SELECT COUNT(*) FROM ipt
          WHERE regdate <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND (dchdate IS NULL OR dchdate > DATE_SUB(CURDATE(), INTERVAL 1 DAY))
        ) AS admitted_yesterday
    `;

const staffCountSql = isPostgres
  ? `SELECT COUNT(*)::int AS count FROM doctor WHERE active = 'Y'`
  : `SELECT COUNT(*) AS count FROM doctor WHERE active = 'Y'`;

const weeklyOpdSql = isPostgres
  ? `
      SELECT vstdate::date AS day, COUNT(*)::int AS count
      FROM ovst
      WHERE vstdate >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY vstdate::date
      ORDER BY day
    `
  : `
      SELECT DATE(vstdate) AS day, COUNT(*) AS count
      FROM ovst
      WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(vstdate)
      ORDER BY day
    `;

const weeklyCompareSql = isPostgres
  ? `
      SELECT
        COUNT(*) FILTER (WHERE vstdate >= CURRENT_DATE - INTERVAL '6 days')::int AS this_week,
        COUNT(*) FILTER (
          WHERE vstdate >= CURRENT_DATE - INTERVAL '13 days'
            AND vstdate < CURRENT_DATE - INTERVAL '6 days'
        )::int AS prev_week
      FROM ovst
      WHERE vstdate >= CURRENT_DATE - INTERVAL '13 days'
    `
  : `
      SELECT
        SUM(CASE WHEN vstdate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) THEN 1 ELSE 0 END) AS this_week,
        SUM(
          CASE
            WHEN vstdate >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
              AND vstdate < DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            THEN 1 ELSE 0
          END
        ) AS prev_week
      FROM ovst
      WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    `;

const topOpdDiagnosesSql = isPostgres
  ? `
      SELECT d.icd10, i.name, COUNT(*)::int AS cnt
      FROM ovstdiag d
      JOIN ovst o ON o.vn = d.vn
      LEFT JOIN icd101 i ON i.code = d.icd10
      WHERE o.vstdate = CURRENT_DATE
        AND d.diagtype = '1'
      GROUP BY d.icd10, i.name
      ORDER BY cnt DESC
      LIMIT 10
    `
  : `
      SELECT d.icd10, i.name, COUNT(*) AS cnt
      FROM ovstdiag d
      JOIN ovst o ON o.vn = d.vn
      LEFT JOIN icd101 i ON i.code = d.icd10
      WHERE o.vstdate = CURDATE()
        AND d.diagtype = '1'
      GROUP BY d.icd10, i.name
      ORDER BY cnt DESC
      LIMIT 10
    `;

async function queryCountPair(sql: string): Promise<DashboardStat | null> {
  const [row] = await queryHosxp<CountPairRow>(sql);
  const today = toNumber(row?.today);
  const yesterday = toNumber(row?.yesterday);
  return buildStat(today, yesterday);
}

export async function getOpdTodayStats(): Promise<DashboardStat | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    return await queryCountPair(opdTodaySql);
  } catch {
    return null;
  }
}

export async function getAppointmentTodayStats(): Promise<DashboardStat | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    return await queryCountPair(appointmentTodaySql);
  } catch {
    return null;
  }
}

export async function getAvailableBedStats(): Promise<DashboardStat | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const [row] = await queryHosxp<BedStatsRow>(bedStatsSql);
    const totalBeds = toNumber(row?.total_beds);
    const admittedNow = toNumber(row?.admitted_now);
    const admittedYesterday = toNumber(row?.admitted_yesterday);
    const emptyToday = Math.max(totalBeds - admittedNow, 0);
    const emptyYesterday = Math.max(totalBeds - admittedYesterday, 0);
    return buildStat(emptyToday, emptyYesterday);
  } catch {
    return null;
  }
}

export async function getStaffStats(): Promise<DashboardStat | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const [row] = await queryHosxp<{ count: number }>(staffCountSql);
    const count = toNumber(row?.count);
    return { count, change: "0%", positive: true };
  } catch {
    return null;
  }
}

export async function getWeeklyOpdSummary(): Promise<WeeklyOpdSummary | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const [rows, [compare]] = await Promise.all([
      queryHosxp<WeeklyCountRow>(weeklyOpdSql),
      queryHosxp<WeekCompareRow>(weeklyCompareSql),
    ]);

    const data = toWeeklyPoints(rows);
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const avg = data.length > 0 ? Math.round(total / data.length) : 0;
    const peak = data.reduce((max, d) => (d.count > max.count ? d : max), data[0] ?? { day: "—", label: "—", count: 0 });
    const thisWeek = toNumber(compare?.this_week);
    const prevWeek = toNumber(compare?.prev_week);
    const { change, positive } = formatChange(thisWeek, prevWeek);

    return { data, total, avg, peak, change, positive };
  } catch {
    return null;
  }
}

export async function getTopOpdDiagnoses(): Promise<TopOpdDiagnosis[] | null> {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const rows = await queryHosxp<TopDiagnosisRow>(topOpdDiagnosesSql);
    return rows.map((row, index) => ({
      rank: index + 1,
      icd10: row.icd10,
      name: row.name?.trim() || row.icd10,
      count: toNumber(row.cnt),
    }));
  } catch {
    return null;
  }
}
