import { getSupabase } from './client';

export interface CaptureLeadParams {
  email: string;
  reportId: string;
  persona?: string;
  company?: string;
}

export async function captureLead(params: CaptureLeadParams): Promise<void> {
  const { email, reportId, persona, company } = params;
  const isLocalReport = reportId === 'local';

  // Save to leads table (report_id is null for local reports)
  const { error: leadError } = await getSupabase().from('leads').insert({
    email,
    report_id: isLocalReport ? null : reportId,
    persona: persona || null,
    company: company || null,
    source: 'storyproof',
  });

  if (leadError) throw new Error(`Failed to capture lead: ${leadError.message}`);

  // Update report with email (skip for local reports)
  if (!isLocalReport) {
    const { error: reportError } = await getSupabase()
      .from('reports')
      .update({ email, lead_captured_at: new Date().toISOString() })
      .eq('id', reportId);

    if (reportError) {
      console.error('Failed to update report with email:', reportError.message);
    }
  }
}
