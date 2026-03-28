export type CategoryKey =
  | 'narrative_structure'
  | 'business_communication'
  | 'slide_level_quality'
  | 'slide_design_quality'
  | 'persuasion_conviction'
  | 'structural_completeness'
  | 'biopharma_specific';

export type ModelTier = 'fast' | 'standard' | 'advanced';

export type SignalStatus = 'pass' | 'flag' | 'fail';

export type ScoreGrade = 'Excellent' | 'Good' | 'Needs Work' | 'Critical Issues';

export interface SignalDefinition {
  id: number; // 1-36
  key: string;
  name: string;
  category: CategoryKey;
  description: string;
  goodCriteria: string;
  needsWorkCriteria: string;
  requiresPptxOnly: boolean;
  modelTier: ModelTier;
  conversionCritical: boolean; // true for signals 12, 26, 30
}

export interface CategoryDefinition {
  key: CategoryKey;
  name: string;
  weight: number; // 0.20, 0.18, etc.
  signalIds: number[];
}

export interface SignalResult {
  id: number;
  key: string;
  name: string;
  score: number; // 1-10
  status: SignalStatus;
  evidence: string; // specific deck references
  finding: string; // 2-3 sentence assessment
  notAssessable?: boolean; // true if PDF and signal requires PPTX
}

export interface CategoryResult {
  key: CategoryKey;
  name: string;
  score: number; // 0-100
  signals: SignalResult[];
  summary: string; // 2-3 sentence category finding
}

export interface CriticalIssue {
  signalId: number;
  signalName: string;
  categoryName: string;
  evidence: string;
  businessConsequence: string;
  severity: number; // lower score = higher severity
}

export interface QuickWin {
  signalId: number;
  signalName: string;
  categoryName: string;
  suggestion: string;
  impact: string;
  effort: 'low' | 'medium';
}

export interface SlideAssessment {
  slideNumber: number;
  title: string | null;
  wordCount: number;
  textDensity: SignalStatus;
  titleQuality: SignalStatus;
  keyIssue: string | null;
  overallStatus: SignalStatus;
}

export interface ScoringResult {
  overallScore: number; // 0-100
  overallGrade: ScoreGrade;
  categoryResults: CategoryResult[];
  criticalIssues: CriticalIssue[];
  quickWins: QuickWin[];
  slideAssessments: SlideAssessment[];
  upsellRecommendations: import('./upsell').UpsellRecommendation[];
}
