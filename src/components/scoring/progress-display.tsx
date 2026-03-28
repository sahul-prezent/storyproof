'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ProgressDisplayProps {
  step: string;
  percentage: number;
  error?: string | null;
}

const STEP_LABELS: Record<string, string> = {
  uploading: 'Uploading your presentation...',
  parsing: 'Reading slide content...',
  fetching_brand: 'Fetching brand details from website...',
  scoring_narrative: 'Analyzing narrative structure...',
  scoring_communication: 'Evaluating business communication...',
  scoring_slide_quality: 'Assessing slide-level quality...',
  scoring_design: 'Checking slide design quality...',
  scoring_persuasion: 'Measuring persuasion and conviction...',
  scoring_structural: 'Verifying structural completeness...',
  scoring_biopharma: 'Running BioPharma-specific analysis...',
  scoring_brand: 'Scoring brand alignment...',
  aggregating: 'Calculating your StoryProof Score...',
  saving: 'Preparing your report...',
  complete: 'Your report is ready!',
};

const GRADIENT = 'linear-gradient(90deg, #21A7E0 0%, #68FFEB 26%, #93FFA2 40%, #FFD769 57%, #FF9B3E 70%, #FF9143 89%)';

export function ProgressDisplay({ step, percentage, error }: ProgressDisplayProps) {
  const label = STEP_LABELS[step] || step;
  const isComplete = step === 'complete';

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
      {/* Animated ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-10 relative"
      >
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer glow pulse */}
          {!error && !isComplete && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: GRADIENT }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.08, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Gradient border ring */}
          <div
            className="absolute inset-3 rounded-full p-[2px]"
            style={{ background: GRADIENT }}
          >
            <div className="w-full h-full rounded-full bg-[#0B1D3A]" />
          </div>

          {/* Rotating arc */}
          {!error && !isComplete && (
            <motion.div
              className="absolute inset-3 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, #21A7E0 25%, #93FFA2 40%, #FF9B3E 55%, transparent 65%)`,
                padding: '2px',
                maskImage: 'radial-gradient(transparent 62%, black 63%)',
                WebkitMaskImage: 'radial-gradient(transparent 62%, black 63%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Center percentage */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold"
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {error ? '!' : isComplete ? '100' : `${percentage}`}
            </span>
            <span className="text-xs text-[#94A3B8] -mt-0.5">
              {error ? '' : '%'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Step label */}
      <motion.h2
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold mb-4 text-white"
      >
        {error ? 'Something went wrong' : label}
      </motion.h2>

      {error ? (
        <p className="text-base text-red-400 max-w-sm">{error}</p>
      ) : (
        <>
          <div className="w-full max-w-sm mb-6">
            <Progress
              value={percentage}
              className="h-2.5 bg-white/10 [&>div]:rounded-full"
              style={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['--progress-bg' as any]: GRADIENT,
              }}
            />
          </div>
          <p className="text-base text-[#94A3B8] mb-8">
            Analyzing your presentation...
          </p>
          <p className="text-sm text-[#94A3B8]/50">
            This typically takes 30–60 seconds
          </p>
        </>
      )}
    </div>
  );
}
