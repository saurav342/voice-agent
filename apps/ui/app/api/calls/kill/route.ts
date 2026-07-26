import { NextResponse } from "next/server";

import { api, ApiError } from "@/lib/api";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(await api.post("/calls/kill", body));
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(err.body ?? { error: err.message }, {
        status: err.status,
      });
    }
    throw err;
  }
}
