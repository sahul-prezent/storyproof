'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Globe } from 'lucide-react';
import type {
  AudienceContext,
  AudienceType,
  PresentationPurpose,
  AudienceFamiliarity,
  RegulatoryContext,
  DesiredOutcome,
} from '@/types/context';
import {
  AUDIENCE_TYPE_LABELS,
  PURPOSE_LABELS,
  FAMILIARITY_LABELS,
  REGULATORY_LABELS,
  OUTCOME_LABELS,
} from '@/types/context';
import { cn } from '@/lib/utils';

interface QuestionnaireProps {
  onSubmit: (context: AudienceContext) => void;
  disabled?: boolean;
}

export function Questionnaire({ onSubmit, disabled }: QuestionnaireProps) {
  const [audienceType, setAudienceType] = useState<AudienceType | null>(null);
  const [purpose, setPurpose] = useState<PresentationPurpose | null>(null);
  const [familiarity, setFamiliarity] = useState<AudienceFamiliarity | null>(null);
  const [regulatory, setRegulatory] = useState<RegulatoryContext | null>(null);
  const [outcome, setOutcome] = useState<DesiredOutcome | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState('');

  const isComplete = audienceType && purpose && familiarity && regulatory && outcome;

  const handleSubmit = () => {
    if (!isComplete) return;
    onSubmit({
      audienceType,
      presentationPurpose: purpose,
      audienceFamiliarity: familiarity,
      regulatoryContext: regulatory,
      desiredOutcome: outcome,
      companyWebsite: companyWebsite.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Company Website — for brand alignment scoring */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#21A7E0]" />
            Company website
            <span className="text-[#94A3B8] text-sm font-normal">(for brand alignment scoring)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="url"
            value={companyWebsite}
            onChange={e => setCompanyWebsite(e.target.value)}
            placeholder="e.g. pfizer.com"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-[#94A3B8]/60 focus:border-[#21A7E0] focus:ring-1 focus:ring-[#21A7E0] outline-none transition-colors"
          />
          <p className="text-xs text-[#94A3B8] mt-2">
            We'll check if your deck's colors and fonts align with your company brand.
          </p>
        </CardContent>
      </Card>

      <QuestionCard
        number={1}
        title="Who is the primary audience?"
        options={AUDIENCE_TYPE_LABELS}
        value={audienceType}
        onChange={setAudienceType}
      />

      <QuestionCard
        number={2}
        title="What is the purpose of this presentation?"
        options={PURPOSE_LABELS}
        value={purpose}
        onChange={setPurpose}
      />

      <QuestionCard
        number={3}
        title="How familiar is the audience with the topic?"
        options={FAMILIARITY_LABELS}
        value={familiarity}
        onChange={setFamiliarity}
      />

      <QuestionCard
        number={4}
        title="What is the regulatory context?"
        options={REGULATORY_LABELS}
        value={regulatory}
        onChange={setRegulatory}
      />

      <QuestionCard
        number={5}
        title="What is the desired outcome?"
        options={OUTCOME_LABELS}
        value={outcome}
        onChange={setOutcome}
      />

      <Button
        size="lg"
        className="w-full rounded-full bg-[#0B1D3A] hover:bg-[#112D4E] text-white font-medium text-lg py-6 border border-white/10"
        disabled={!isComplete || disabled}
        onClick={handleSubmit}
      >
        Get Your StoryProof Score
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

function QuestionCard<T extends string>({
  number,
  title,
  options,
  value,
  onChange,
}: {
  number: number;
  title: string;
  options: Record<T, string>;
  value: T | null;
  onChange: (val: T) => void;
}) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-white">
          <span className="text-[#94A3B8] mr-2">{number}.</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2.5">
          {(Object.entries(options) as [T, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                value === key
                  ? 'border-transparent bg-[#0B1D3A] text-white prezent-gradient-border prezent-gradient-border-active'
                  : 'border-white/20 text-[#CBD5E1] hover:border-white/40 hover:bg-white/5'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
