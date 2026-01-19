// app/api/status/route.ts
/* =========================================
   API: Status
   - tells the UI if we are in mock or openai mode
   ========================================= */

import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    hasKey: !!process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID ?? null,
  });
}