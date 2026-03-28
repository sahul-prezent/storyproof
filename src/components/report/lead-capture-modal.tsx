'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import type { StoredReport } from '@/lib/db/reports';

interface LeadCaptureModalProps {
  reportId: string;
  report?: StoredReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCaptureModal({
  reportId,
  report,
  open,
  onOpenChange,
}: LeadCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reportId,
          company,
          // Pass full report data for PDF generation
          reportData: report ? {
            overall_score: report.overall_score,
            overall_grade: report.overall_grade,
            file_name: report.file_name,
            slide_count: report.slide_count,
            critical_issues: report.critical_issues,
            quick_wins: report.quick_wins,
            category_findings: report.category_findings,
            slide_assessments: report.slide_assessments,
            upsell_recommendations: report.upsell_recommendations,
            audience_type: report.audience_type,
            presentation_purpose: report.presentation_purpose,
          } : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Your Report
          </DialogTitle>
          <DialogDescription>
            We&apos;ll send your full StoryProof report with a shareable link to your inbox.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-4 text-center">
            <p className="text-sm font-medium text-emerald-600">
              Report sent! Check your inbox for the full report and link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="text-xs font-medium">
                Work Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label htmlFor="company" className="text-xs font-medium">
                Company (optional)
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Pharma"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Report to My Email'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LeadCaptureInline({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <div className="text-center py-6 px-4 rounded-lg border border-dashed bg-muted/20">
      <p className="text-sm font-medium mb-2">
        Want this report in your inbox with a shareable link?
      </p>
      <Button size="sm" variant="outline" onClick={onOpen}>
        <Mail className="mr-2 h-4 w-4" />
        Email My Report
      </Button>
    </div>
  );
}
