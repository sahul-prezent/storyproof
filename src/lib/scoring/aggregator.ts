import type { CategoryResult, ScoreGrade, SlideAssessment, SignalStatus } from '@/types/scoring';
import type { ParsedPresentation } from '@/types/presentation';
import { CATEGORIES } from './categories';

export interface AggregatedScore {
  overallScore: number;
  overallGrade: ScoreGrade;
  categoryScores: Record<string, number>;
}

export function aggregateScores(
  categoryResults: CategoryResult[],
  fileType: 'pptx' | 'pdf'
): AggregatedScore {
  let totalWeight = 0;
  let weightedSum = 0;
  const categoryScores: Record<string, number> = {};

  for (const result of categoryResults) {
    const catDef = CATEGORIES.find(c => c.key === result.key);
    if (!catDef) continue;

    // For PDF files, if all signals in a category are not assessable, skip it
    const assessableSignals = result.signals.filter(s => !s.notAssessable);
    if (assessableSignals.length === 0) continue;

    // Category score is average of assessable signal scores, scaled to 0-100
    const avgSignalScore =
      assessableSignals.reduce((sum, s) => sum + s.score, 0) / assessableSignals.length;
    const categoryScore = Math.round(avgSignalScore * 10); // 1-10 → 10-100

    categoryScores[result.key] = categoryScore;

    // Adjust weight if some signals weren't assessable
    const weightFactor = assessableSignals.length / result.signals.length;
    const adjustedWeight = catDef.weight * weightFactor;

    weightedSum += categoryScore * adjustedWeight;
    totalWeight += adjustedWeight;
  }

  // Normalize if total weight < 1 (e.g., PDF missing design signals)
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const overallGrade = scoreToGrade(overallScore);

  return { overallScore, overallGrade, categoryScores };
}

export function scoreToGrade(score: number): ScoreGrade {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Needs Work';
  return 'Critical Issues';
}

export function buildSlideAssessments(
  categoryResults: CategoryResult[],
  presentation: ParsedPresentation
): SlideAssessment[] {
  return presentation.slides.map(slide => {
    // Check text density
    const textDensity: SignalStatus =
      slide.wordCount <= 50 ? 'pass' : slide.wordCount <= 100 ? 'flag' : 'fail';

    // Check title quality from the slide-level quality signals
    const titleQualitySignal = categoryResults
      .flatMap(c => c.signals)
      .find(s => s.key === 'slide_title_quality');

    const titleQuality: SignalStatus = slide.title
      ? titleQualitySignal?.status || 'pass'
      : 'fail';

    // Find the most relevant issue for this slide from all signals
    const keyIssue = findSlideKeyIssue(slide.slideNumber, categoryResults);

    const overallStatus: SignalStatus =
      textDensity === 'fail' || titleQuality === 'fail'
        ? 'fail'
        : textDensity === 'flag' || titleQuality === 'flag'
          ? 'flag'
          : 'pass';

    return {
      slideNumber: slide.slideNumber,
      title: slide.title,
      wordCount: slide.wordCount,
      textDensity,
      titleQuality,
      keyIssue,
      overallStatus,
    };
  });
}

function findSlideKeyIssue(
  slideNumber: number,
  categoryResults: CategoryResult[]
): string | null {
  // Search all signal findings for mentions of this slide number
  const slideRef = `slide ${slideNumber}`;
  const slideRefAlt = `Slide ${slideNumber}`;

  for (const cat of categoryResults) {
    for (const signal of cat.signals) {
      if (
        signal.status !== 'pass' &&
        (signal.evidence.toLowerCase().includes(slideRef.toLowerCase()) ||
          signal.evidence.includes(slideRefAlt))
      ) {
        // Extract a brief issue description
        return `${signal.name}: ${signal.finding.split('.')[0]}.`;
      }
    }
  }

  return null;
}
