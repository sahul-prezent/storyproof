'use client';

import {
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface RadarChartProps {
  categoryScores: Record<string, number>;
}

const CATEGORY_SHORT_NAMES: Record<string, string> = {
  narrative_structure: 'Narrative',
  business_communication: 'Communication',
  slide_level_quality: 'Slide Quality',
  slide_design_quality: 'Design',
  persuasion_conviction: 'Persuasion',
  structural_completeness: 'Structure',
  biopharma_specific: 'BioPharma',
};

export function RadarChart({ categoryScores }: RadarChartProps) {
  const data = Object.entries(categoryScores).map(([key, score]) => ({
    category: CATEGORY_SHORT_NAMES[key] || key,
    score,
    fullMark: 100,
  }));

  return (
    <div className="w-full max-w-md mx-auto h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
