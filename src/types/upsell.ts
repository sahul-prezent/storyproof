export type PrezentProduct =
  | 'prezent_op_service'
  | 'prezent_platform_story_builder'
  | 'prezent_platform_audience_calibrator'
  | 'prezent_platform_slide_simplification'
  | 'prezent_op_full_rebuild';

export interface UpsellRecommendation {
  product: PrezentProduct;
  productName: string;
  triggerCondition: string;
  description: string;
  specificIssues: string[]; // actual issues found that triggered this
  priority: number; // 1 = highest
}

export const PREZENT_PRODUCTS: Record<PrezentProduct, { name: string; description: string }> = {
  prezent_op_service: {
    name: 'Prezent OP Service',
    description: 'Overnight Presentation — a human expert rebuilds the deck to brand standard, corrects template inconsistencies, and applies visual hierarchy.',
  },
  prezent_platform_story_builder: {
    name: 'Prezent.ai — Story Builder',
    description: 'Structured narrative templates for BioPharma decks with proven storytelling frameworks for each deck type.',
  },
  prezent_platform_audience_calibrator: {
    name: 'Prezent.ai — Audience Calibrator',
    description: 'Rewrites content to the right complexity level for the target audience.',
  },
  prezent_platform_slide_simplification: {
    name: 'Prezent.ai — Slide Simplification',
    description: 'Converts text-heavy slides into visual communication structures.',
  },
  prezent_op_full_rebuild: {
    name: 'Prezent OP Service — Full Rebuild',
    description: 'End-to-end reconstruction with Prezent\'s storytelling methodology and brand-compliant design.',
  },
};
