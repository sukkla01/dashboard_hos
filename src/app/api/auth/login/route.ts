import { NextResponse } from "next/server";

import { authenticateOpduser } from "@/lib/auth/opduser";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { loginname?: string; password?: string };
    const loginname = body.loginname?.trim() ?? "";
    const password = body.password ?? "";

    if (!loginname || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 },
      );
    }

    const user = await authenticateOpduser(loginname, password);
    if (!user) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    await setSessionCookie(user);

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 503 },
    );
  }
}
