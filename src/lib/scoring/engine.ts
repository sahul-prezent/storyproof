import type { ParsedPresentation } from '@/types/presentation';
import type { AudienceContext } from '@/types/context';
import type {
  CategoryResult,
  SignalResult,
  CriticalIssue,
  QuickWin,
  ScoringResult,
} from '@/types/scoring';
import { buildAllCategoryPrompts, type CategoryPrompt } from '@/lib/ai/prompts/builder';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { complete, getCategoryTier } from '@/lib/ai/router';
import { categoryResponseSchema } from '@/lib/ai/schemas/scoring';
import { SIGNALS } from './categories';
import { aggregateScores, buildSlideAssessments } from './aggregator';
import { evaluateUpsellTriggers } from './upsell';
import type { BrandDetails } from '@/lib/brand/fetcher';

export type ProgressCallback = (step: string, pct: number) => void;

export async function scorePresentation(
  presentation: ParsedPresentation,
  context: AudienceContext,
  onProgress?: ProgressCallback,
  brandDetails?: BrandDetails
): Promise<ScoringResult> {
  // 1. Build prompts for all 7 categories
  const categoryPrompts = buildAllCategoryPrompts(presentation, context);

  // 2. Score all categories in parallel
  const categoryResults = await scoreCategoriesInParallel(
    categoryPrompts,
    presentation,
    onProgress
  );

  // 2b. Score brand alignment if brand details available
  if (brandDetails && brandDetails.colors.length > 0) {
    onProgress?.('scoring_brand', 83);
    const brandResult = await scoreBrandAlignment(presentation, brandDetails);
    if (brandResult) {
      categoryResults.push(brandResult);
    }
  }

  onProgress?.('aggregating', 85);

  // 3. Aggregate scores
  const { overallScore, overallGrade, categoryScores: _ } = aggregateScores(
    categoryResults,
    presentation.fileType
  );

  // 4. Derive critical issues and quick wins
  const criticalIssues = deriveCriticalIssues(categoryResults);
  const quickWins = deriveQuickWins(categoryResults);

  // 5. Build slide assessments
  const slideAssessments = buildSlideAssessments(categoryResults, presentation);

  // 6. Evaluate upsell triggers
  const upsellRecommendations = evaluateUpsellTriggers(categoryResults, overallScore);

  onProgress?.('saving', 95);

  return {
    overallScore,
    overallGrade,
    categoryResults,
    criticalIssues,
    quickWins,
    slideAssessments,
    upsellRecommendations,
  };
}

async function scoreBrandAlignment(
  presentation: ParsedPresentation,
  brand: BrandDetails
): Promise<CategoryResult | null> {
  try {
    const deckColors = presentation.metadata.uniqueColors;
    const deckFonts = presentation.metadata.uniqueFonts;

    const prompt = `You are a brand compliance expert. Score how well this presentation aligns with the company's brand guidelines.

## Company Brand (from website)
- Brand Colors: ${brand.colors.join(', ') || 'Unknown'}
- Brand Fonts: ${brand.fonts.join(', ') || 'Unknown'}
- Primary Color: ${brand.primaryColor || 'Unknown'}

## Presentation Details
- Colors used in deck: ${deckColors.join(', ') || 'No colors detected'}
- Fonts used in deck: ${deckFonts.join(', ') || 'No fonts detected'}
- Total slides: ${presentation.totalSlides}

Score these 3 brand alignment signals on a scale of 1-10:

1. color_alignment: Do the presentation colors match the company's brand colors?
2. font_alignment: Do the presentation fonts match the company's brand fonts?
3. overall_brand_consistency: Overall, does the presentation feel on-brand?

For each signal, provide:
- score (1-10)
- status ("pass" if 7+, "flag" if 4-6, "fail" if 1-3)
- evidence (specific colors/fonts found vs expected)
- finding (2-3 sentence assessment)

Respond in JSON:
{
  "signals": [
    { "id": 101, "score": 7, "status": "pass", "evidence": "...", "finding": "..." },
    { "id": 102, "score": 5, "status": "flag", "evidence": "...", "finding": "..." },
    { "id": 103, "score": 6, "status": "flag", "evidence": "...", "finding": "..." }
  ],
  "category_summary": "2-3 sentence overall brand alignment assessment"
}`;

    const result = await complete('standard', {
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: prompt,
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 2048,
    });

    const parsed = JSON.parse(result.content);

    const signalNames: Record<number, { key: string; name: string }> = {
      101: { key: 'color_alignment', name: 'Brand Color Alignment' },
      102: { key: 'font_alignment', name: 'Brand Font Alignment' },
      103: { key: 'overall_brand_consistency', name: 'Overall Brand Consistency' },
    };

    const signals: SignalResult[] = (parsed.signals || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => ({
        id: s.id,
        key: signalNames[s.id]?.key || `brand_${s.id}`,
        name: signalNames[s.id]?.name || 'Brand Signal',
        score: s.score,
        status: s.status,
        evidence: s.evidence,
        finding: s.finding,
      })
    );

    const avgScore = signals.length > 0
      ? Math.round((signals.reduce((sum, s) => sum + s.score, 0) / signals.length) * 10)
      : 50;

    return {
      key: 'brand_alignment' as never, // Extra category not in the fixed CategoryKey type
      name: 'Brand Alignment',
      score: avgScore,
      signals,
      summary: parsed.category_summary || 'Brand alignment assessment based on company website.',
    };
  } catch (err) {
    console.error('Brand alignment scoring failed:', err);
    return null;
  }
}

const CATEGORY_PROGRESS: Record<string, { step: string; pct: number }> = {
  narrative_structure: { step: 'scoring_narrative', pct: 20 },
  business_communication: { step: 'scoring_communication', pct: 30 },
  slide_level_quality: { step: 'scoring_slide_quality', pct: 40 },
  slide_design_quality: { step: 'scoring_design', pct: 50 },
  persuasion_conviction: { step: 'scoring_persuasion', pct: 60 },
  structural_completeness: { step: 'scoring_structural', pct: 70 },
  biopharma_specific: { step: 'scoring_biopharma', pct: 80 },
};

async function scoreCategoriesInParallel(
  categoryPrompts: CategoryPrompt[],
  presentation: ParsedPresentation,
  onProgress?: ProgressCallback
): Promise<CategoryResult[]> {
  const promises = categoryPrompts.map(async (prompt) => {
    const progress = CATEGORY_PROGRESS[prompt.categoryKey];
    onProgress?.(progress?.step || 'scoring', progress?.pct || 50);

    return scoreSingleCategory(prompt, presentation);
  });

  return Promise.all(promises);
}

async function scoreSingleCategory(
  prompt: CategoryPrompt,
  presentation: ParsedPresentation
): Promise<CategoryResult> {
  // Determine model tier based on the most complex signal in the category
  const signalTiers = prompt.signals.map(s => s.modelTier);
  const tier = getCategoryTier(signalTiers);

  try {
    const result = await complete(tier, {
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: prompt.userPrompt,
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 4096,
    });

    // Parse and validate AI response
    const parsed = JSON.parse(result.content);
    const validated = categoryResponseSchema.parse(parsed);

    // Map AI response to our SignalResult type
    const signals: SignalResult[] = prompt.signals.map(signalDef => {
      const aiSignal = validated.signals.find(s => s.id === signalDef.id);

      if (!aiSignal) {
        return defaultSignalResult(signalDef);
      }

      return {
        id: signalDef.id,
        key: signalDef.key,
        name: signalDef.name,
        score: aiSignal.score,
        status: aiSignal.status,
        evidence: aiSignal.evidence,
        finding: aiSignal.finding,
      };
    });

    // Add not-assessable markers for PPTX-only signals when analyzing PDF
    if (presentation.fileType === 'pdf') {
      const allCategorySignals = SIGNALS.filter(
        s => s.category === prompt.categoryKey && s.requiresPptxOnly
      );
      for (const pptxOnlySignal of allCategorySignals) {
        if (!signals.find(s => s.id === pptxOnlySignal.id)) {
          signals.push({
            id: pptxOnlySignal.id,
            key: pptxOnlySignal.key,
            name: pptxOnlySignal.name,
            score: 0,
            status: 'flag',
            evidence: 'Not assessable from PDF format.',
            finding: 'This signal requires PPTX format for accurate assessment.',
            notAssessable: true,
          });
        }
      }
    }

    return {
      key: prompt.categoryKey,
      name: prompt.categoryName,
      score: Math.round(
        (signals.filter(s => !s.notAssessable).reduce((sum, s) => sum + s.score, 0) /
          signals.filter(s => !s.notAssessable).length) *
          10
      ),
      signals,
      summary: validated.category_summary,
    };
  } catch (error) {
    // On failure, return conservative default scores
    console.error(`Scoring failed for ${prompt.categoryKey}:`, error);
    return createFallbackCategoryResult(prompt);
  }
}

function defaultSignalResult(signalDef: typeof SIGNALS[number]): SignalResult {
  return {
    id: signalDef.id,
    key: signalDef.key,
    name: signalDef.name,
    score: 5,
    status: 'flag',
    evidence: 'Could not fully assess this signal.',
    finding: 'This signal could not be fully evaluated. A manual review is recommended.',
  };
}

function createFallbackCategoryResult(prompt: CategoryPrompt): CategoryResult {
  const signals: SignalResult[] = prompt.signals.map(s => defaultSignalResult(s));

  return {
    key: prompt.categoryKey,
    name: prompt.categoryName,
    score: 50,
    signals,
    summary: `${prompt.categoryName} could not be fully evaluated due to a processing error. The scores shown are conservative estimates.`,
  };
}

function deriveCriticalIssues(categoryResults: CategoryResult[]): CriticalIssue[] {
  const allSignals: (SignalResult & { categoryName: string })[] = [];

  for (const cat of categoryResults) {
    for (const signal of cat.signals) {
      if (!signal.notAssessable) {
        allSignals.push({ ...signal, categoryName: cat.name });
      }
    }
  }

  // Sort by score ascending (worst first), prioritize conversion-critical signals
  const signalDefs = SIGNALS;
  allSignals.sort((a, b) => {
    const aDef = signalDefs.find(s => s.id === a.id);
    const bDef = signalDefs.find(s => s.id === b.id);
    const aBoost = aDef?.conversionCritical ? -2 : 0;
    const bBoost = bDef?.conversionCritical ? -2 : 0;
    return (a.score + aBoost) - (b.score + bBoost);
  });

  return allSignals.slice(0, 3).map(signal => ({
    signalId: signal.id,
    signalName: signal.name,
    categoryName: signal.categoryName,
    evidence: signal.evidence,
    businessConsequence: deriveConsequence(signal),
    severity: signal.score,
  }));
}

function deriveQuickWins(categoryResults: CategoryResult[]): QuickWin[] {
  const allSignals: (SignalResult & { categoryName: string })[] = [];

  for (const cat of categoryResults) {
    for (const signal of cat.signals) {
      if (!signal.notAssessable && signal.status === 'flag') {
        allSignals.push({ ...signal, categoryName: cat.name });
      }
    }
  }

  // Quick wins are flagged signals (4-6) that are easiest to fix
  const easyFixSignals = [
    'text_density', 'bullet_overload', 'closing_cta', 'headline_clarity',
    'slide_title_quality', 'appendix_hygiene', 'slide_count_efficiency',
  ];

  allSignals.sort((a, b) => {
    const aEasy = easyFixSignals.includes(a.key) ? -1 : 0;
    const bEasy = easyFixSignals.includes(b.key) ? -1 : 0;
    return (aEasy - bEasy) || (b.score - a.score); // Higher score = easier to push to pass
  });

  return allSignals.slice(0, 3).map(signal => ({
    signalId: signal.id,
    signalName: signal.name,
    categoryName: signal.categoryName,
    suggestion: signal.finding,
    impact: `Improving this from ${signal.score}/10 could meaningfully raise your ${signal.categoryName} score.`,
    effort: easyFixSignals.includes(signal.key) ? 'low' as const : 'medium' as const,
  }));
}

function deriveConsequence(signal: SignalResult): string {
  const consequenceMap: Record<string, string> = {
    opening_hook: 'Your audience decides in the first 10 seconds whether to pay attention. A weak opening means you lose the room before you start.',
    story_arc: 'Without a clear narrative arc, your audience cannot follow your argument or remember your key message.',
    audience_empathy: 'When the deck talks about you instead of the audience, decision-makers disengage because they do not see their problem being addressed.',
    stakes_clarity: 'Without naming the cost of inaction, your audience has no urgency to act on your recommendation.',
    mlr_readiness: 'MLR compliance issues can delay your launch timeline and create legal risk. These flags would likely be caught in review.',
    evidence_quality: 'Unsubstantiated claims erode credibility with sophisticated BioPharma audiences who expect data-driven arguments.',
    text_density: 'Text-heavy slides force the audience to read instead of listen, reducing both comprehension and engagement.',
  };

  return consequenceMap[signal.key] || `This issue reduces the overall impact and effectiveness of your presentation for the target audience.`;
}
