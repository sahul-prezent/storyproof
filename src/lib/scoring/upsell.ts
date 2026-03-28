import type { CategoryResult } from '@/types/scoring';
import type { UpsellRecommendation, PrezentProduct } from '@/types/upsell';
import { PREZENT_PRODUCTS } from '@/types/upsell';

interface UpsellRule {
  product: PrezentProduct;
  condition: (categoryResults: CategoryResult[], overallScore: number) => boolean;
  getIssues: (categoryResults: CategoryResult[]) => string[];
  triggerCondition: string;
  priority: number;
}

const UPSELL_RULES: UpsellRule[] = [
  {
    product: 'prezent_op_full_rebuild',
    triggerCondition: 'Overall score below 55',
    priority: 1,
    condition: (_, overallScore) => overallScore < 55,
    getIssues: (results) =>
      results
        .filter(c => getCategoryScore(c) < 55)
        .map(c => `${c.name}: scored ${getCategoryScore(c)}/100`),
  },
  {
    product: 'prezent_op_service',
    triggerCondition: 'Design quality score below 60',
    priority: 2,
    condition: (results) => {
      const design = results.find(c => c.key === 'slide_design_quality');
      return design ? getCategoryScore(design) < 60 : false;
    },
    getIssues: (results) => {
      const design = results.find(c => c.key === 'slide_design_quality');
      return design?.signals.filter(s => s.status !== 'pass').map(s => s.finding) || [];
    },
  },
  {
    product: 'prezent_platform_story_builder',
    triggerCondition: 'Narrative structure score below 65',
    priority: 3,
    condition: (results) => {
      const narrative = results.find(c => c.key === 'narrative_structure');
      return narrative ? getCategoryScore(narrative) < 65 : false;
    },
    getIssues: (results) => {
      const narrative = results.find(c => c.key === 'narrative_structure');
      return narrative?.signals.filter(s => s.status !== 'pass').map(s => s.finding) || [];
    },
  },
  {
    product: 'prezent_platform_audience_calibrator',
    triggerCondition: 'Scientific translation score below 60',
    priority: 3,
    condition: (results) => {
      const biopharma = results.find(c => c.key === 'biopharma_specific');
      const sciTranslation = biopharma?.signals.find(s => s.key === 'scientific_translation');
      return sciTranslation ? sciTranslation.score < 6 : false;
    },
    getIssues: (results) => {
      const biopharma = results.find(c => c.key === 'biopharma_specific');
      const sciTranslation = biopharma?.signals.find(s => s.key === 'scientific_translation');
      return sciTranslation ? [sciTranslation.finding] : [];
    },
  },
  {
    product: 'prezent_platform_slide_simplification',
    triggerCondition: 'Text density flag on 3+ slides',
    priority: 4,
    condition: (results) => {
      const slideQuality = results.find(c => c.key === 'slide_level_quality');
      const textDensity = slideQuality?.signals.find(s => s.key === 'text_density');
      const bulletOverload = slideQuality?.signals.find(s => s.key === 'bullet_overload');
      return (textDensity?.status !== 'pass') || (bulletOverload?.status !== 'pass');
    },
    getIssues: (results) => {
      const slideQuality = results.find(c => c.key === 'slide_level_quality');
      return slideQuality?.signals
        .filter(s => (s.key === 'text_density' || s.key === 'bullet_overload') && s.status !== 'pass')
        .map(s => s.finding) || [];
    },
  },
];

export function evaluateUpsellTriggers(
  categoryResults: CategoryResult[],
  overallScore: number
): UpsellRecommendation[] {
  const recommendations: UpsellRecommendation[] = [];

  for (const rule of UPSELL_RULES) {
    if (rule.condition(categoryResults, overallScore)) {
      const product = PREZENT_PRODUCTS[rule.product];
      recommendations.push({
        product: rule.product,
        productName: product.name,
        triggerCondition: rule.triggerCondition,
        description: product.description,
        specificIssues: rule.getIssues(categoryResults).slice(0, 3),
        priority: rule.priority,
      });
    }
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

function getCategoryScore(result: CategoryResult): number {
  const assessable = result.signals.filter(s => !s.notAssessable);
  if (assessable.length === 0) return 0;
  const avg = assessable.reduce((sum, s) => sum + s.score, 0) / assessable.length;
  return Math.round(avg * 10);
}
