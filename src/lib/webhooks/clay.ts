interface ClayLeadPayload {
  email: string;
  company?: string;
  reportId: string;
  reportUrl: string;
  fileName: string;
  overallScore: number;
  overallGrade: string;
  slideCount: number;
  audienceType: string;
  presentationPurpose: string;
  topIssue1?: string;
  topIssue2?: string;
  topIssue3?: string;
  capturedAt: string;
  // LinkedIn OAuth fields
  linkedinSignup?: boolean;
  fullName?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  provider?: string;
  signupSource?: string;
}

/**
 * Push lead data to Clay via incoming webhook.
 * Fails silently (logs error) so it never blocks the user flow.
 */
export async function pushToClay(payload: ClayLeadPayload): Promise<void> {
  const webhookUrl = process.env.CLAY_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('CLAY_WEBHOOK_URL not configured — skipping Clay push.');
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Clay webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error('Clay webhook error:', err);
  }
}
