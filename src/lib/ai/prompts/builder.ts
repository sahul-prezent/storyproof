import type { ParsedPresentation } from '@/types/presentation';
import type { AudienceContext } from '@/types/context';
import type { SignalDefinition, CategoryKey } from '@/types/scoring';
import { getSignalsForCategory, CATEGORIES } from '@/lib/scoring/categories';
import {
  AUDIENCE_TYPE_LABELS,
  PURPOSE_LABELS,
  FAMILIARITY_LABELS,
  REGULATORY_LABELS,
  OUTCOME_LABELS,
} from '@/types/context';

const MAX_WORDS_PER_SLIDE = 200;
const MAX_SLIDES_FULL = 25;

export interface CategoryPrompt {
  categoryKey: CategoryKey;
  categoryName: string;
  signals: SignalDefinition[];
  userPrompt: string;
}

export function buildCategoryPrompt(
  categoryKey: CategoryKey,
  presentation: ParsedPresentation,
  context: AudienceContext
): CategoryPrompt {
  const category = CATEGORIES.find(c => c.key === categoryKey)!;
  const signals = getSignalsForCategory(categoryKey);

  // Filter out PPTX-only signals for PDF files
  const assessableSignals =
    presentation.fileType === 'pdf'
      ? signals.filter(s => !s.requiresPptxOnly)
      : signals;

  const contextBlock = formatContext(context, presentation);
  const slidesBlock = formatSlides(presentation);
  const signalsBlock = formatSignals(assessableSignals);

  const userPrompt = `${contextBlock}

${slidesBlock}

## Scoring Task: ${category.name}

Score each of the following signals on a scale of 1-10. For each signal, provide:
- score (1-10, where 10 is exceptional and 1 is critical failure)
- status ("pass" if 7+, "flag" if 4-6, "fail" if 1-3)
- evidence (cite specific slide numbers and quote actual text from the deck)
- finding (2-3 sentence expert assessment)

${signalsBlock}

Respond in this exact JSON format:
{
  "signals": [
    { "id": <signal_id>, "score": <1-10>, "status": "<pass|flag|fail>", "evidence": "<specific deck references>", "finding": "<2-3 sentence assessment>" }
  ],
  "category_summary": "<2-3 sentence overall finding for ${category.name}>"
}`;

  return {
    categoryKey,
    categoryName: category.name,
    signals: assessableSignals,
    userPrompt,
  };
}

export function buildAllCategoryPrompts(
  presentation: ParsedPresentation,
  context: AudienceContext
): CategoryPrompt[] {
  return CATEGORIES.map(cat => buildCategoryPrompt(cat.key, presentation, context));
}

function formatContext(context: AudienceContext, presentation: ParsedPresentation): string {
  return `## Presentation Context
- File: ${presentation.fileName} (${presentation.fileType.toUpperCase()}, ${presentation.totalSlides} slides)
- Primary Audience: ${AUDIENCE_TYPE_LABELS[context.audienceType]}
- Purpose: ${PURPOSE_LABELS[context.presentationPurpose]}
- Audience Familiarity: ${FAMILIARITY_LABELS[context.audienceFamiliarity]}
- Regulatory Context: ${REGULATORY_LABELS[context.regulatoryContext]}
- Desired Outcome: ${OUTCOME_LABELS[context.desiredOutcome]}
- Total Word Count: ${presentation.metadata.totalWordCount}
- Charts: ${presentation.metadata.totalChartCount} | Images: ${presentation.metadata.totalImageCount}
- Fonts Used: ${presentation.metadata.uniqueFonts.join(', ') || 'N/A'}
- Has Appendix: ${presentation.metadata.hasAppendix ? 'Yes' : 'No'}`;
}

function formatSlides(presentation: ParsedPresentation): string {
  const lines: string[] = ['## Slide Content'];

  const slides = presentation.slides;
  const showFull = slides.length <= MAX_SLIDES_FULL;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const title = slide.title || '[No title]';
    let body = slide.bodyText;

    // Truncate body text for very wordy slides
    const words = body.split(/\s+/);
    if (words.length > MAX_WORDS_PER_SLIDE) {
      body = words.slice(0, MAX_WORDS_PER_SLIDE).join(' ') + '... [truncated]';
    }

    if (!showFull && i >= 20) {
      // For large decks, summarize remaining slides
      if (i === 20) {
        const remaining = slides.length - 20;
        lines.push(`\n[...${remaining} additional slides summarized...]`);
        const avgWords = Math.round(
          slides.slice(20).reduce((s, sl) => s + sl.wordCount, 0) / remaining
        );
        lines.push(`Average word count: ${avgWords} | Charts: ${slides.slice(20).filter(s => s.hasChart).length}`);
      }
      continue;
    }

    const indicators: string[] = [];
    indicators.push(`Words: ${slide.wordCount}`);
    if (slide.bulletCount > 0) indicators.push(`Bullets: ${slide.bulletCount}`);
    if (slide.hasChart) indicators.push('Has Chart');
    if (slide.hasImage) indicators.push(`Images: ${slide.imageCount}`);

    lines.push(`\n[Slide ${slide.slideNumber}] Title: "${title}" | ${indicators.join(' | ')}`);
    if (body) {
      lines.push(body);
    }
  }

  return lines.join('\n');
}

function formatSignals(signals: SignalDefinition[]): string {
  const lines = ['Signals to score:'];

  for (const signal of signals) {
    lines.push(`\n${signal.id}. ${signal.name}`);
    lines.push(`   What to assess: ${signal.description}`);
    lines.push(`   Good: ${signal.goodCriteria}`);
    lines.push(`   Needs Work: ${signal.needsWorkCriteria}`);
  }

  return lines.join('\n');
}
