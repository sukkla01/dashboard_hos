import { createHash, timingSafeEqual } from "crypto";

import { hosxpConfig } from "@/lib/db/config";
import { queryHosxp } from "@/lib/db/query";

import type { SessionUser } from "./types";

type OpduserRow = {
  loginname: string;
  name: string | null;
  password: string | null;
  passweb: string | null;
  department: string | null;
};

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function md5Hex(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

function matchesMd5(stored: string, inputPassword: string): boolean {
  const hash = md5Hex(inputPassword);
  return safeEqual(stored, hash) || safeEqual(stored, hash.toUpperCase());
}

function verifyPassword(row: OpduserRow, inputPassword: string): boolean {
  if (row.password && safeEqual(row.password, inputPassword)) {
    return true;
  }

  if (row.passweb) {
    if (safeEqual(row.passweb, inputPassword)) {
      return true;
    }
    if (row.passweb.length === 32 && matchesMd5(row.passweb, inputPassword)) {
      return true;
    }
  }

  return false;
}
function opduserSelectSql(): string {
  if (hosxpConfig.type === "postgres") {
    return `
      SELECT loginname, name, password, passweb, department
      FROM opduser
      WHERE loginname = $1
      LIMIT 1
    `;
  }

  return `
    SELECT loginname, name, password, passweb, department
    FROM opduser
    WHERE loginname = ?
    LIMIT 1
  `;
}

async function fetchOpduser(loginname: string): Promise<OpduserRow | null> {
  try {
    const rows = await queryHosxp<OpduserRow>(opduserSelectSql(), [loginname]);
    return rows[0] ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.toLowerCase().includes("passweb")) {
      throw error;
    }

    const fallbackSql =
      hosxpConfig.type === "postgres"
        ? `SELECT loginname, name, password, department FROM opduser WHERE loginname = $1 LIMIT 1`
        : `SELECT loginname, name, password, department FROM opduser WHERE loginname = ? LIMIT 1`;

    const rows = await queryHosxp<Omit<OpduserRow, "passweb">>(fallbackSql, [loginname]);
    const row = rows[0];
    if (!row) return null;

    return { ...row, passweb: null };
  }
}

export async function authenticateOpduser(
  loginname: string,
  password: string,
): Promise<SessionUser | null> {
  const trimmedLogin = loginname.trim();
  if (!trimmedLogin || !password) return null;

  const row = await fetchOpduser(trimmedLogin);
  if (!row || !verifyPassword(row, password)) return null;

  return {
    loginname: row.loginname,
    name: row.name?.trim() || row.loginname,
    department: row.department?.trim() || null,
  };
}
