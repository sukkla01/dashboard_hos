/** วันนี้ในรูปแบบ YYYY-MM-DD (local timezone) */
export function todayDateISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** วันแรกของเดือนปัจจุบัน */
export function monthStartDateISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** แปลง URL param เป็นวันที่ค.ศ. — ค่าไม่ถูกต้องจะ fallback เป็นวันนี้ */
export function parseDateParam(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return todayDateISO();
  }

  const [y, m, d] = value.split("-").map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return todayDateISO();
  }

  return value;
}

/** แปลงช่วงวันที่จาก URL — ถ้า from > to จะสลับให้ถูกต้อง */
export function parseDateRange(
  fromParam: string | undefined,
  toParam: string | undefined,
): { from: string; to: string } {
  const to = parseDateParam(toParam);
  const from = fromParam ? parseDateParam(fromParam) : monthStartDateISO();

  if (from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}
