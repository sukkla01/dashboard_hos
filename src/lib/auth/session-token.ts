import type { SessionUser } from "./types";

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours

type SessionPayload = SessionUser & {
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable is required in production");
  }
  return secret ?? "dev-only-change-me";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

async function sign(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function encodeSession(user: SessionUser): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const data = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${data}.${await sign(data)}`;
}

export async function decodeSession(token: string): Promise<SessionUser | null> {
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return null;

  const data = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expected = await sign(data);

  try {
    const sigBuf = base64UrlToBytes(signature);
    const expBuf = base64UrlToBytes(expected);
    if (!timingSafeEqualBytes(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }

  try {
    const json = new TextDecoder().decode(base64UrlToBytes(data));
    const payload = JSON.parse(json) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!payload.loginname || !payload.name) return null;

    return {
      loginname: payload.loginname,
      name: payload.name,
      department: payload.department ?? null,
    };
  } catch {
    return null;
  }
}

export { SESSION_MAX_AGE };
