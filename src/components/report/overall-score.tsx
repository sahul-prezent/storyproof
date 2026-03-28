'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { ScoreGrade } from '@/types/scoring';
import { cn } from '@/lib/utils';

interface OverallScoreProps {
  score: number;
  grade: ScoreGrade;
}

const GRADE_COLORS: Record<ScoreGrade, string> = {
  Excellent: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30',
  Good: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  'Needs Work': 'text-amber-300 bg-amber-500/20 border-amber-500/30',
  'Critical Issues': 'text-red-300 bg-red-500/20 border-red-500/30',
};

const SCORE_RING_COLORS: Record<ScoreGrade, string> = {
  Excellent: 'stroke-[#00C9A7]',
  Good: 'stroke-[#2ED573]',
  'Needs Work': 'stroke-[#FFC048]',
  'Critical Issues': 'stroke-[#FF8C42]',
};

const GRADE_DESCRIPTIONS: Record<ScoreGrade, string> = {
  Excellent: 'Strong storytelling and communication. Minor refinements only.',
  Good: 'Solid foundation with specific gaps in 2–3 categories.',
  'Needs Work': 'Multiple structural and communication issues. Audience likely losing the thread.',
  'Critical Issues': 'Fundamental storytelling and structural failures. High risk of poor audience reception.',
};

export function OverallScore({ score, grade }: OverallScoreProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-block relative mb-4"
      >
        <svg width="140" height="140" className="transform -rotate-90">
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/10"
          />
          <motion.circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={SCORE_RING_COLORS[grade]}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold text-white"
          >
            {score}
          </motion.span>
        </div>
      </motion.div>

      <div className="mb-2">
        <Badge
          variant="outline"
          className={cn('text-sm px-3 py-1', GRADE_COLORS[grade])}
        >
          {grade}
        </Badge>
      </div>

      <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
        {GRADE_DESCRIPTIONS[grade]}
      </p>
    </div>
  );
}
