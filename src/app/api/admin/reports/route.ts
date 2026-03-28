import { NextRequest } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  // Get reports
  const { data: reports, error, count } = await supabase
    .from('reports')
    .select(
      'id, created_at, file_name, file_type, slide_count, overall_score, overall_grade, user_email, email, audience_type, presentation_purpose',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Admin reports error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get leads to check email delivery status
  const { data: leads } = await supabase
    .from('leads')
    .select('report_id, email, created_at');

  // Map leads to reports
  const leadsByReport: Record<string, { email: string; sent_at: string }> = {};
  for (const lead of leads || []) {
    if (lead.report_id) {
      leadsByReport[lead.report_id] = {
        email: lead.email,
        sent_at: lead.created_at,
      };
    }
  }

  const enrichedReports = (reports || []).map(r => ({
    ...r,
    lead_email: leadsByReport[r.id]?.email || r.email || null,
    email_sent: !!leadsByReport[r.id],
    email_sent_at: leadsByReport[r.id]?.sent_at || null,
  }));

  return Response.json({ reports: enrichedReports, total: count || 0, page, limit });
}
