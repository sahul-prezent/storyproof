export type AudienceType =
  | 'kol_hcp'
  | 'payer'
  | 'internal_leadership'
  | 'investor'
  | 'regulatory'
  | 'cross_functional'
  | 'training_audience';

export type PresentationPurpose =
  | 'formulary_pitch'
  | 'launch_deck'
  | 'board_update'
  | 'kol_engagement'
  | 'training_module'
  | 'qbr'
  | 'pipeline_update'
  | 'other';

export type AudienceFamiliarity =
  | 'expert'
  | 'knowledgeable'
  | 'general'
  | 'unfamiliar';

export type RegulatoryContext =
  | 'approved'
  | 'investigational'
  | 'pipeline_preclinical'
  | 'not_applicable';

export type DesiredOutcome =
  | 'decision_approval'
  | 'awareness_education'
  | 'alignment'
  | 'funding_investment';

export interface AudienceContext {
  audienceType: AudienceType;
  presentationPurpose: PresentationPurpose;
  audienceFamiliarity: AudienceFamiliarity;
  regulatoryContext: RegulatoryContext;
  desiredOutcome: DesiredOutcome;
  companyWebsite?: string;
}

export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  kol_hcp: 'KOL / HCP',
  payer: 'Payer',
  internal_leadership: 'Internal Leadership',
  investor: 'Investor',
  regulatory: 'Regulatory',
  cross_functional: 'Cross-Functional',
  training_audience: 'Training Audience',
};

export const PURPOSE_LABELS: Record<PresentationPurpose, string> = {
  formulary_pitch: 'Formulary Pitch',
  launch_deck: 'Launch Deck',
  board_update: 'Board Update',
  kol_engagement: 'KOL Engagement',
  training_module: 'Training Module',
  qbr: 'QBR',
  pipeline_update: 'Pipeline Update',
  other: 'Other',
};

export const FAMILIARITY_LABELS: Record<AudienceFamiliarity, string> = {
  expert: 'Expert',
  knowledgeable: 'Knowledgeable',
  general: 'General',
  unfamiliar: 'Unfamiliar',
};

export const REGULATORY_LABELS: Record<RegulatoryContext, string> = {
  approved: 'Approved Product',
  investigational: 'Investigational',
  pipeline_preclinical: 'Pipeline / Pre-Clinical',
  not_applicable: 'Not Applicable',
};

export const OUTCOME_LABELS: Record<DesiredOutcome, string> = {
  decision_approval: 'Decision / Approval',
  awareness_education: 'Awareness / Education',
  alignment: 'Alignment',
  funding_investment: 'Funding / Investment',
};
