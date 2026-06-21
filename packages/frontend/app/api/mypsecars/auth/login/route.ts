import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type User = { username: string; password: string };

const USERS_FILE = path.join(
  process.cwd(),
  "app",
  "(features)",
  "MyPSECar",
  "_data",
  "users.json"
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { username, password } = body ?? {};

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set("session", user.username, {
    httpOnly: true,
    path: "/MyPSECar",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
  });
  return response;
}
