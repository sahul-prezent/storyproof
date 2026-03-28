'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-browser';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Loader2, AlertCircle } from 'lucide-react';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const authError = searchParams.get('error');

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  );
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a confirmation link.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(redirect);
        router.refresh();
      }
    }

    setLoading(false);
  };

  const handleLinkedInLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full prezent-hero-bg">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-white border-0 shadow-xl rounded-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-[#0B1D3A]">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-gray-500 text-base">
              {mode === 'login'
                ? 'Sign in to view your StoryProof reports'
                : 'Sign up to save and track your reports'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* LinkedIn OAuth */}
            <Button
              variant="outline"
              className="w-full rounded-full border-gray-200 text-[#0B1D3A] hover:bg-gray-50 text-base py-5"
              onClick={handleLinkedInLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LinkedInIcon className="mr-2 h-5 w-5" />
              )}
              Continue with LinkedIn
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-3 text-gray-400">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="fullName" className="text-sm font-medium text-[#0B1D3A]">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-3 text-base bg-white text-[#0B1D3A] focus:border-[#21A7E0] focus:ring-1 focus:ring-[#21A7E0] outline-none"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="text-sm font-medium text-[#0B1D3A]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-3 text-base bg-white text-[#0B1D3A] focus:border-[#21A7E0] focus:ring-1 focus:ring-[#21A7E0] outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-[#0B1D3A]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-3 text-base bg-white text-[#0B1D3A] focus:border-[#21A7E0] focus:ring-1 focus:ring-[#21A7E0] outline-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {message && (
                <p className="text-sm text-emerald-600">{message}</p>
              )}

              <Button
                type="submit"
                className="w-full rounded-full bg-[#0B1D3A] hover:bg-[#112D4E] text-white text-base py-5"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-5 w-5" />
                )}
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    className="text-[#0B1D3A] hover:underline font-semibold"
                    onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    className="text-[#0B1D3A] hover:underline font-semibold"
                    onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
