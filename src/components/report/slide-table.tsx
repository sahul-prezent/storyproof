import { Badge } from '@/components/ui/badge';
import type { SlideAssessment, SignalStatus } from '@/types/scoring';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SlideTableProps {
  slides: SlideAssessment[];
}

const STATUS_DOT: Record<SignalStatus, string> = {
  pass: 'bg-emerald-500',
  flag: 'bg-amber-500',
  fail: 'bg-red-500',
};

const STATUS_LABELS: Record<SignalStatus, string> = {
  pass: 'Pass',
  flag: 'Needs Attention',
  fail: 'Critical',
};

export function SlideTable({ slides }: SlideTableProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Slide-by-Slide Summary</h2>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium w-12">#</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-center font-medium w-16">Words</th>
              <th className="px-3 py-2 text-center font-medium w-20">Text Density</th>
              <th className="px-3 py-2 text-center font-medium w-20">Title Quality</th>
              <th className="px-3 py-2 text-left font-medium">Key Issue</th>
            </tr>
          </thead>
          <tbody>
            {slides.map(slide => (
              <tr
                key={slide.slideNumber}
                className={cn(
                  'border-b last:border-0',
                  slide.overallStatus === 'fail' && 'bg-red-50/50 dark:bg-red-950/20'
                )}
              >
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {slide.slideNumber}
                </td>
                <td className="px-3 py-2 max-w-[200px] truncate">
                  {slide.title || <span className="text-muted-foreground italic">No title</span>}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {slide.wordCount}
                </td>
                <td className="px-3 py-2 text-center">
                  <StatusDot status={slide.textDensity} />
                </td>
                <td className="px-3 py-2 text-center">
                  <StatusDot status={slide.titleQuality} />
                </td>
                <td className="px-3 py-2 text-muted-foreground max-w-[250px] truncate">
                  {slide.keyIssue || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {slides.map(slide => (
          <div
            key={slide.slideNumber}
            className={cn(
              'p-3 rounded-lg border text-xs',
              slide.overallStatus === 'fail' && 'border-red-200 bg-red-50/50'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">
                Slide {slide.slideNumber}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {slide.wordCount} words
              </Badge>
            </div>
            <p className="truncate text-muted-foreground mb-2">
              {slide.title || 'No title'}
            </p>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[slide.textDensity])} />
                <span className="text-muted-foreground">Density</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[slide.titleQuality])} />
                <span className="text-muted-foreground">Title</span>
              </div>
            </div>
            {slide.keyIssue && (
              <p className="mt-2 text-red-600 dark:text-red-400">{slide.keyIssue}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusDot({ status }: { status: SignalStatus }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className={cn(
            'inline-block w-2.5 h-2.5 rounded-full cursor-default',
            STATUS_DOT[status]
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{STATUS_LABELS[status]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
