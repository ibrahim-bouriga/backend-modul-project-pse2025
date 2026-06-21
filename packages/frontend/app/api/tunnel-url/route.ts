import { NextResponse } from 'next/server';
import { getTunnelUrl } from '../../_lib/tunnel';


export async function GET() {
  const url = await getTunnelUrl();
  return NextResponse.json({ url }, { status: url ? 200 : 503 });
}
