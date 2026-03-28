import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { pushToClay } from '@/lib/webhooks/clay';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user details after successful OAuth
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata || {};
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

        // Push LinkedIn sign-up to Clay
        pushToClay({
          email: user.email || '',
          company: meta.company || meta.organization || '',
          reportId: '',
          reportUrl: '',
          fileName: '',
          overallScore: 0,
          overallGrade: '',
          slideCount: 0,
          audienceType: '',
          presentationPurpose: '',
          topIssue1: undefined,
          topIssue2: undefined,
          topIssue3: undefined,
          capturedAt: new Date().toISOString(),
          // Extra LinkedIn fields
          linkedinSignup: true,
          fullName: meta.full_name || meta.name || '',
          avatarUrl: meta.avatar_url || meta.picture || '',
          linkedinUrl: meta.profile_url || meta.custom_claims?.profile_url || '',
          provider: user.app_metadata?.provider || 'linkedin_oidc',
          signupSource: appUrl,
        });
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
