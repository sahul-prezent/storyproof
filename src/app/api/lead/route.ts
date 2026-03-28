import { NextRequest } from 'next/server';
import { captureLead } from '@/lib/db/leads';
import { getReport } from '@/lib/db/reports';
import { sendReportEmail } from '@/lib/email/send-report';
import { pushToClay } from '@/lib/webhooks/clay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reportId, persona, company, reportData } = body;

    if (!email || !reportId) {
      return Response.json(
        { error: 'Email and report ID are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Save lead to DB
    await captureLead({ email, reportId, persona, company });

    // Get full report data (from DB or from the request body for local reports)
    const dbReport = reportId !== 'local' ? await getReport(reportId) : null;
    const r = dbReport || reportData;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Helper to normalize field names (DB uses snake_case, local uses camelCase)
    const get = (snakeKey: string, camelKey: string) => r?.[snakeKey] ?? r?.[camelKey];

    // Send email with PDF attachment
    if (process.env.RESEND_API_KEY && r) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizeIssue = (i: any) => ({
          signalName: i?.signalName || i?.signal_name || 'Issue',
          categoryName: i?.categoryName || i?.category_name || '',
          evidence: i?.evidence || '',
          businessConsequence: i?.businessConsequence || i?.business_consequence || '',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizeWin = (w: any) => ({
          signalName: w?.signalName || w?.signal_name || 'Quick Win',
          suggestion: w?.suggestion || '',
          effort: w?.effort || 'medium',
        });

        await sendReportEmail({
          to: email,
          reportId,
          overallScore: get('overall_score', 'overallScore') ?? 0,
          overallGrade: get('overall_grade', 'overallGrade') ?? '',
          fileName: get('file_name', 'fileName') ?? 'Presentation',
          criticalIssues: (get('critical_issues', 'criticalIssues') ?? []).slice(0, 3).map(normalizeIssue),
          quickWins: (get('quick_wins', 'quickWins') ?? []).slice(0, 3).map(normalizeWin),
          categoryFindings: get('category_findings', 'categoryFindings') ?? [],
          slideAssessments: get('slide_assessments', 'slideAssessments') ?? [],
          upsellRecommendations: get('upsell_recommendations', 'upsellRecommendations') ?? [],
        });
      } catch (emailErr) {
        console.error('Email send failed (non-blocking):', emailErr);
      }
    }

    // Push to Clay webhook (non-blocking)
    if (r) {
      const issues = get('critical_issues', 'criticalIssues') ?? [];
      pushToClay({
        email,
        company,
        reportId,
        reportUrl: `${appUrl}/report/${reportId}`,
        fileName: get('file_name', 'fileName') ?? 'Presentation',
        overallScore: get('overall_score', 'overallScore') ?? 0,
        overallGrade: get('overall_grade', 'overallGrade') ?? '',
        slideCount: get('slide_count', 'slideCount') ?? 0,
        audienceType: get('audience_type', 'audienceType') ?? '',
        presentationPurpose: get('presentation_purpose', 'presentationPurpose') ?? '',
        topIssue1: issues[0]?.signalName || issues[0]?.signal_name,
        topIssue2: issues[1]?.signalName || issues[1]?.signal_name,
        topIssue3: issues[2]?.signalName || issues[2]?.signal_name,
        capturedAt: new Date().toISOString(),
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to capture lead.';
    return Response.json({ error: message }, { status: 500 });
  }
}
