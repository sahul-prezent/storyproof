import { getSupabase } from './client';
import type { ScoringResult } from '@/types/scoring';
import type { AudienceContext } from '@/types/context';

export interface SaveReportParams {
  fileName: string;
  fileType: 'pptx' | 'pdf';
  slideCount: number;
  context: AudienceContext;
  result: ScoringResult;
  userId?: string;
  userEmail?: string;
}

export interface StoredReport {
  id: string;
  created_at: string;
  file_name: string;
  file_type: string;
  slide_count: number;
  audience_type: string;
  presentation_purpose: string;
  audience_familiarity: string;
  regulatory_context: string;
  desired_outcome: string;
  overall_score: number;
  overall_grade: string;
  category_scores: Record<string, number>;
  signal_scores: Record<string, unknown>;
  critical_issues: unknown[];
  quick_wins: unknown[];
  category_findings: unknown[];
  slide_assessments: unknown[];
  upsell_recommendations: unknown[];
}

export async function saveReport(params: SaveReportParams): Promise<string> {
  const { fileName, fileType, slideCount, context, result, userId, userEmail } = params;

  const categoryScores: Record<string, number> = {};
  for (const cat of result.categoryResults) {
    categoryScores[cat.key] = cat.score;
  }

  const baseRow = {
    file_name: fileName,
    file_type: fileType,
    slide_count: slideCount,
    audience_type: context.audienceType,
    presentation_purpose: context.presentationPurpose,
    audience_familiarity: context.audienceFamiliarity,
    regulatory_context: context.regulatoryContext,
    desired_outcome: context.desiredOutcome,
    overall_score: result.overallScore,
    overall_grade: result.overallGrade,
    category_scores: categoryScores,
    signal_scores: result.categoryResults.flatMap(c => c.signals),
    critical_issues: result.criticalIssues,
    quick_wins: result.quickWins,
    category_findings: result.categoryResults.map(c => ({
      key: c.key,
      name: c.name,
      score: c.score,
      summary: c.summary,
      signals: c.signals,
    })),
    slide_assessments: result.slideAssessments,
    upsell_recommendations: result.upsellRecommendations,
  };

  // Try with user columns first, retry without if columns don't exist yet
  const rowWithUser = {
    ...baseRow,
    ...(userId && { user_id: userId }),
    ...(userEmail && { user_email: userEmail }),
  };

  const { data, error } = await getSupabase()
    .from('reports')
    .insert(rowWithUser)
    .select('id')
    .single();

  if (error) {
    // If the error is about unknown columns, retry without user fields
    if (error.message.includes('user_id') || error.message.includes('user_email') || error.code === 'PGRST204') {
      console.warn('Retrying saveReport without user columns:', error.message);
      const { data: retryData, error: retryError } = await getSupabase()
        .from('reports')
        .insert(baseRow)
        .select('id')
        .single();

      if (retryError) throw new Error(`Failed to save report: ${retryError.message}`);
      return retryData.id;
    }
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return data.id;
}

export async function getReport(id: string): Promise<StoredReport | null> {
  const { data, error } = await getSupabase()
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as StoredReport;
}
