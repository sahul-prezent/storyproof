import { NextRequest } from 'next/server';
import { getReport } from '@/lib/db/reports';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 10) {
    return Response.json({ error: 'Invalid report ID.' }, { status: 400 });
  }

  const report = await getReport(id);

  if (!report) {
    return Response.json({ error: 'Report not found.' }, { status: 404 });
  }

  return Response.json(report);
}
