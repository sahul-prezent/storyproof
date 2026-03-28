'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Questionnaire } from '@/components/context/questionnaire';
import { FileText } from 'lucide-react';
import type { AudienceContext } from '@/types/context';

export default function ContextPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedName = sessionStorage.getItem('storyproof_fileName');
    const storedPath = sessionStorage.getItem('storyproof_storagePath');
    if (!storedName || !storedPath) {
      router.push('/');
      return;
    }
    setFileName(storedName);
  }, [router]);

  const handleSubmit = (context: AudienceContext) => {
    setSubmitting(true);
    sessionStorage.setItem('storyproof_context', JSON.stringify(context));
    router.push('/scoring');
  };

  if (!fileName) return null;

  return (
    <div className="flex flex-col min-h-full prezent-hero-bg">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-xl">
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl border border-white/10 bg-white/5">
          <FileText className="h-5 w-5 text-[#21A7E0] shrink-0" />
          <span className="text-base font-medium truncate text-white">{fileName}</span>
          <button
            onClick={() => router.push('/')}
            className="ml-auto text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            Change file
          </button>
        </div>

        <h2 className="text-3xl font-semibold mb-2 text-white">
          Tell us about your audience
        </h2>
        <p className="text-lg text-[#94A3B8] mb-8">
          These 5 questions help calibrate the scoring to your specific
          presentation context.
        </p>

        <Questionnaire onSubmit={handleSubmit} disabled={submitting} />
      </main>

      <Footer />
    </div>
  );
}
