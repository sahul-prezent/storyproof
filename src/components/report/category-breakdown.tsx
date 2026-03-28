'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SignalStatus } from '@/types/scoring';
import { cn } from '@/lib/utils';

interface CategoryFinding {
  key: string;
  name: string;
  score: number;
  summary: string;
  signals: {
    id: number;
    name: string;
    score: number;
    status: SignalStatus;
    finding: string;
    evidence: string;
    notAssessable?: boolean;
  }[];
}

interface CategoryBreakdownProps {
  categories: CategoryFinding[];
}

const STATUS_COLORS: Record<SignalStatus, string> = {
  pass: 'bg-emerald-500',
  flag: 'bg-amber-500',
  fail: 'bg-red-500',
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Category Breakdown</h2>

      <Accordion className="space-y-2">
        {categories.map(cat => (
          <AccordionItem key={cat.key} value={cat.key} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 w-full mr-4">
                <span className="text-sm font-medium flex-shrink-0">
                  {cat.name}
                </span>
                <Progress value={cat.score} className="h-2 flex-1 max-w-[200px]" />
                <span className="text-sm font-mono text-muted-foreground w-10 text-right">
                  {cat.score}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">{cat.summary}</p>

              <div className="space-y-3">
                {cat.signals.map(signal => (
                  <div
                    key={signal.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-md border',
                      signal.notAssessable && 'opacity-50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        signal.notAssessable
                          ? 'bg-muted'
                          : STATUS_COLORS[signal.status]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{signal.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {signal.notAssessable ? 'N/A' : `${signal.score}/10`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {signal.finding}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
