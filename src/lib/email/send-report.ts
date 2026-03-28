import { Resend } from 'resend';
import { generateReportPdf } from './generate-pdf';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface SendReportEmailParams {
  to: string;
  reportId: string;
  overallScore: number;
  overallGrade: string;
  fileName: string;
  criticalIssues: { signalName: string; categoryName?: string; businessConsequence: string; evidence?: string }[];
  quickWins: { signalName: string; suggestion: string; effort?: string }[];
  categoryFindings?: { key: string; name: string; score: number; summary: string; signals: { name: string; score: number; status: string; finding: string }[] }[];
  slideAssessments?: { slideNumber: number; title: string | null; wordCount: number; textDensity: string; titleQuality: string; keyIssue: string | null; overallStatus: string }[];
  upsellRecommendations?: { productName: string; description: string; specificIssues: string[] }[];
}

export async function sendReportEmail(params: SendReportEmailParams) {
  const {
    to,
    reportId,
    overallScore,
    overallGrade,
    fileName,
    criticalIssues,
    quickWins,
    categoryFindings,
    slideAssessments,
    upsellRecommendations,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const reportUrl = `${appUrl}/report/${reportId}`;

  const gradeColor =
    overallGrade === 'Excellent' ? '#10b981'
    : overallGrade === 'Good' ? '#3b82f6'
    : overallGrade === 'Needs Work' ? '#f59e0b'
    : '#ef4444';

  // Generate PDF
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateReportPdf({
      file_name: fileName,
      overall_score: overallScore,
      overall_grade: overallGrade,
      critical_issues: criticalIssues.map(i => ({
        signalName: i.signalName,
        categoryName: i.categoryName || '',
        evidence: i.evidence || '',
        businessConsequence: i.businessConsequence,
      })),
      quick_wins: quickWins.map(w => ({
        signalName: w.signalName,
        suggestion: w.suggestion,
        effort: w.effort || 'medium',
      })),
      category_findings: categoryFindings || [],
      slide_assessments: slideAssessments || [],
      upsell_recommendations: upsellRecommendations || [],
    });
  } catch (pdfErr) {
    console.error('PDF generation failed:', pdfErr);
  }

  // Build a concise email body (the full report is in the PDF)
  const issuesList = criticalIssues.slice(0, 3)
    .map(i => `<li style="margin-bottom:4px;font-size:13px;color:#dc2626;">${i.signalName}</li>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:20px;">
      <span style="font-size:18px;font-weight:700;color:#111;">StoryProof</span>
      <span style="font-size:11px;color:#999;display:block;">by Prezent.ai</span>
    </div>

    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;text-align:center;">

      <p style="font-size:13px;color:#666;margin:0 0 4px;">Your StoryProof Score for</p>
      <p style="font-size:15px;font-weight:600;color:#111;margin:0 0 16px;">${fileName}</p>

      <div style="display:inline-block;width:72px;height:72px;border-radius:50%;border:4px solid ${gradeColor};line-height:64px;text-align:center;font-size:26px;font-weight:700;color:#111;">
        ${overallScore}
      </div>
      <p style="margin:10px 0 20px;font-size:13px;font-weight:600;color:${gradeColor};">${overallGrade}</p>

      ${criticalIssues.length > 0 ? `
      <div style="text-align:left;margin-bottom:16px;">
        <p style="font-size:12px;font-weight:600;color:#111;margin:0 0 6px;">Top Issues Found:</p>
        <ul style="margin:0;padding-left:18px;">${issuesList}</ul>
      </div>` : ''}

      <p style="font-size:12px;color:#666;margin:16px 0 0;">
        Your full diagnostic report is attached as a PDF.
      </p>

      ${reportId !== 'local' ? `
      <p style="font-size:11px;color:#999;margin:12px 0 0;">
        You can also <a href="${reportUrl}" style="color:#111;text-decoration:underline;">view it online</a>.
      </p>` : ''}
    </div>

    <div style="text-align:center;padding:20px 0;font-size:11px;color:#999;">
      <p>Want help fixing these issues? <a href="https://prezent.ai" style="color:#111;text-decoration:underline;">See how Prezent.ai can help</a></p>
    </div>

  </div>
</body>
</html>`;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'StoryProof <onboarding@resend.dev>';

  const safeName = fileName.replace(/[^a-zA-Z0-9_\-. ]/g, '').replace(/\.(pptx|pdf)$/i, '');

  const { error } = await getResend().emails.send({
    from: fromEmail,
    to,
    subject: `StoryProof Report: ${overallScore}/100 (${overallGrade}) — ${fileName}`,
    html,
    attachments: pdfBuffer
      ? [
          {
            filename: `StoryProof_${safeName}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : [],
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
