'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ProgressDisplay } from '@/components/scoring/progress-display';
import { storeReport } from '@/lib/utils/report-store';

export default function ScoringPage() {
  const router = useRouter();
  const [step, setStep] = useState('uploading');
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const storagePath = sessionStorage.getItem('storyproof_storagePath');
    const fileName = sessionStorage.getItem('storyproof_fileName');
    const fileType = sessionStorage.getItem('storyproof_fileType');
    const contextJson = sessionStorage.getItem('storyproof_context');

    if (!storagePath || !fileName || !fileType || !contextJson) {
      router.push('/');
      return;
    }

    const context = JSON.parse(contextJson);

    startScoring({ storagePath, fileName, fileType, context });

    async function startScoring(payload: Record<string, unknown>) {
      try {
        const response = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          setError(errData?.error || `Server error: ${response.status}`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError('Failed to start scoring stream.');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === 'progress') {
                  setStep(event.step);
                  setPercentage(event.pct);
                }

                if (event.type === 'complete') {
                  // Store report in IndexedDB for local (no-DB) fallback
                  if (event.report) {
                    await storeReport({
                      ...event.report,
                      id: event.reportId,
                      file_name: fileName,
                      slide_count: event.report.slideAssessments?.length || 0,
                    });
                  }

                  // Clean up
                  sessionStorage.removeItem('storyproof_storagePath');
                  sessionStorage.removeItem('storyproof_fileName');
                  sessionStorage.removeItem('storyproof_fileType');
                  sessionStorage.removeItem('storyproof_context');

                  router.push(`/report/${event.reportId}`);
                }

                if (event.type === 'error') {
                  setError(event.message);
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred.'
        );
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-full prezent-hero-bg">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <ProgressDisplay step={step} percentage={percentage} error={error} />
      </main>
    </div>
  );
}
