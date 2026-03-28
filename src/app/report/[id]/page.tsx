'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { OverallScore } from '@/components/report/overall-score';
import { RadarChart } from '@/components/report/radar-chart';
import { CriticalIssues } from '@/components/report/critical-issues';
import { QuickWins } from '@/components/report/quick-wins';
import { CategoryBreakdown } from '@/components/report/category-breakdown';
import { SlideTable } from '@/components/report/slide-table';
import { UpsellSection } from '@/components/report/upsell-section';
import { LeadCaptureModal, LeadCaptureInline } from '@/components/report/lead-capture-modal';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { retrieveReport, clearReport } from '@/lib/utils/report-store';
import type { StoredReport } from '@/lib/db/reports';

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    loadReport();

    async function loadReport() {
      // Try IndexedDB first (local/no-DB fallback)
      try {
        const data = await retrieveReport();
        if (data) {
          setReport({
            id: reportId,
            created_at: new Date().toISOString(),
            file_name: data.file_name || 'Presentation',
            file_type: 'pptx',
            slide_count: data.slide_count || data.slideAssessments?.length || 0,
            audience_type: '',
            presentation_purpose: '',
            audience_familiarity: '',
            regulatory_context: '',
            desired_outcome: '',
            overall_score: data.overallScore,
            overall_grade: data.overallGrade,
            category_scores: Object.fromEntries(
              (data.categoryResults || []).map((c: { key: string; score: number }) => [c.key, c.score])
            ),
            signal_scores: {},
            critical_issues: data.criticalIssues || [],
            quick_wins: data.quickWins || [],
            category_findings: (data.categoryResults || []).map((c: { key: string; name: string; score: number; summary: string; signals: unknown[] }) => ({
              key: c.key,
              name: c.name,
              score: c.score,
              summary: c.summary,
              signals: c.signals,
            })),
            slide_assessments: data.slideAssessments || [],
            upsell_recommendations: data.upsellRecommendations || [],
          });
          await clearReport();
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to API fetch
      }

      // Fetch from API
      if (reportId === 'local') {
        setError('Report data not found. Please score a presentation again.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'Report not found.' : 'Failed to load report.');
          return;
        }
        const data = await res.json();
        setReport(data);
      } catch {
        setError('Failed to load report.');
      } finally {
        setLoading(false);
      }
    }
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-[#F8FAFC]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00C9A7]" />
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col min-h-full bg-[#F8FAFC]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">{error || 'Report not found.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Dark header section with score */}
      <div className="prezent-hero-bg">
        <Header />
        <div className="container mx-auto px-4 max-w-3xl pt-4 pb-8">
          {/* File info */}
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl border border-white/10 bg-white/5">
            <FileText className="h-4 w-4 text-[#00C9A7] shrink-0" />
            <span className="text-sm font-medium truncate text-white">{report.file_name}</span>
            <Badge variant="outline" className="text-[10px] ml-auto shrink-0 border-white/20 text-[#94A3B8]">
              {report.slide_count} slides
            </Badge>
          </div>

          {/* Section 1: Overall Score */}
          <OverallScore
            score={report.overall_score}
            grade={report.overall_grade as 'Excellent' | 'Good' | 'Needs Work' | 'Critical Issues'}
          />
        </div>
      </div>

      {/* Light content section */}
      <div className="bg-[#F8FAFC] flex-1">
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Radar Chart */}
          <RadarChart categoryScores={report.category_scores} />

          <div className="space-y-8 mt-8">
            {/* Section 2: Critical Issues */}
            <CriticalIssues issues={report.critical_issues as import('@/types/scoring').CriticalIssue[]} />

            {/* Section 3: Quick Wins */}
            <QuickWins wins={report.quick_wins as import('@/types/scoring').QuickWin[]} />

            {/* Lead Capture CTA */}
            <LeadCaptureInline onOpen={() => setShowLeadModal(true)} />

            {/* Section 4: Category Breakdown */}
            <CategoryBreakdown
              categories={report.category_findings as {
                key: string;
                name: string;
                score: number;
                summary: string;
                signals: {
                  id: number;
                  name: string;
                  score: number;
                  status: 'pass' | 'flag' | 'fail';
                  finding: string;
                  evidence: string;
                  notAssessable?: boolean;
                }[];
              }[]}
            />

            {/* Section 5: Slide Table */}
            <SlideTable
              slides={report.slide_assessments as import('@/types/scoring').SlideAssessment[]}
            />

            {/* Section 6: Upsell */}
            <UpsellSection
              recommendations={report.upsell_recommendations as import('@/types/upsell').UpsellRecommendation[]}
            />

            {/* Final Lead Capture CTA */}
            <LeadCaptureInline onOpen={() => setShowLeadModal(true)} />
          </div>
        </main>
      </div>

      <Footer />

      <LeadCaptureModal
        reportId={reportId}
        report={report}
        open={showLeadModal}
        onOpenChange={setShowLeadModal}
      />
    </div>
  );
}
