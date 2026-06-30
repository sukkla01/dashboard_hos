import { hosxpConfig, isDbConfigured } from "@/lib/db/config";
import { queryHosxp } from "@/lib/db/query";
import { formatPatientName, formatThaiDate, formatTime } from "@/lib/format";

type ReferCountRow = {
  cnt: number;
};

type ReferListRow = {
  hn: string;
  hospcode: string | null;
  hosp_name: string | null;
  refer_date: string | Date;
  rfrcs: string | null;
  clinic: string | null;
  pname: string | null;
  fname: string | null;
  lname: string | null;
};

export type ReferInOutSummary = {
  referIn: number;
  referOut: number;
};

export type ReferItem = {
  direction: "in" | "out";
  directionLabel: string;
  hn: string;
  patientName: string;
  hospitalCode: string;
  hospitalName: string;
  referDate: string;
  referTime: string | null;
  referType: string | null;
  note: string | null;
};

export type ReferInOutData = {
  summary: ReferInOutSummary;
  items: ReferItem[];
};

const isPostgres = hosxpConfig.type === "postgres";

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function referDateValue(value: string | Date): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return String(value).slice(0, 10);
}

function referCountSql(table: "referin" | "referout") {
  return isPostgres
    ? `SELECT COUNT(*)::int AS cnt FROM ${table} WHERE refer_date::date BETWEEN $1::date AND $2::date`
    : `SELECT COUNT(*) AS cnt FROM ${table} WHERE DATE(refer_date) BETWEEN ? AND ?`;
}

function referListSql(table: "referin" | "referout") {
  if (isPostgres) {
    return `
      SELECT
        r.hn,
        r.hospcode,
        h.name AS hosp_name,
        r.refer_date,
        r.rfrcs,
        r.clinic,
        p.pname,
        p.fname,
        p.lname
      FROM ${table} r
      JOIN patient p ON p.hn = r.hn
      LEFT JOIN hospcode h ON h.hospcode = r.hospcode
      WHERE r.refer_date::date BETWEEN $1::date AND $2::date
      ORDER BY r.refer_date DESC, r.hn
    `;
  }

  return `
    SELECT
      r.hn,
      r.hospcode,
      h.name AS hosp_name,
      r.refer_date,
      r.rfrcs,
      r.clinic,
      p.pname,
      p.fname,
      p.lname
    FROM ${table} r
    JOIN patient p ON p.hn = r.hn
    LEFT JOIN hospcode h ON h.hospcode = r.hospcode
    WHERE DATE(r.refer_date) BETWEEN ? AND ?
    ORDER BY r.refer_date DESC, r.hn
  `;
}

function mapReferRow(row: ReferListRow, direction: "in" | "out"): ReferItem {
  const hospitalCode = row.hospcode?.trim() || "—";
  const hospitalName = row.hosp_name?.trim() || hospitalCode;
  const referDate = referDateValue(row.refer_date);
  const referTimeRaw = String(row.refer_date);

  return {
    direction,
    directionLabel: direction === "in" ? "Refer In" : "Refer Out",
    hn: row.hn,
    patientName: formatPatientName(row),
    hospitalCode,
    hospitalName,
    referDate,
    referTime: referTimeRaw.length > 10 ? formatTime(referTimeRaw) : null,
    referType: row.rfrcs?.trim() || null,
    note: row.clinic?.trim() ? `คลินิก ${row.clinic}` : null,
  };
}

async function fetchReferDirection(
  table: "referin" | "referout",
  direction: "in" | "out",
  from: string,
  to: string,
): Promise<{ count: number; items: ReferItem[] }> {
  const params = [from, to];
  const [[countRow], rows] = await Promise.all([
    queryHosxp<ReferCountRow>(referCountSql(table), params),
    queryHosxp<ReferListRow>(referListSql(table), params),
  ]);

  return {
    count: toNumber(countRow?.cnt),
    items: rows.map((row) => mapReferRow(row, direction)),
  };
}

export async function getReferInOutData(from: string, to: string): Promise<ReferInOutData> {
  const empty: ReferInOutData = {
    summary: { referIn: 0, referOut: 0 },
    items: [],
  };

  if (!isDbConfigured()) {
    return empty;
  }

  const [referIn, referOut] = await Promise.all([
    fetchReferDirection("referin", "in", from, to).catch(() => ({ count: 0, items: [] })),
    fetchReferDirection("referout", "out", from, to).catch(() => ({ count: 0, items: [] })),
  ]);

  const items = [...referIn.items, ...referOut.items].sort((a, b) => {
    const dateCompare = b.referDate.localeCompare(a.referDate);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return (b.referTime ?? "").localeCompare(a.referTime ?? "");
  });

  return {
    summary: {
      referIn: referIn.count,
      referOut: referOut.count,
    },
    items,
  };
}

export function formatReferDateRange(from: string, to: string): string {
  if (from === to) {
    return formatThaiDate(from);
  }
  return `${formatThaiDate(from)} – ${formatThaiDate(to)}`;
}
