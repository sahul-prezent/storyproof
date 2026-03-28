import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import type { QuickWin } from '@/types/scoring';

interface QuickWinsProps {
  wins: QuickWin[];
}

export function QuickWins({ wins }: QuickWinsProps) {
  if (wins.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Zap className="h-5 w-5 text-emerald-500" />
        Top 3 Quick Wins
      </h2>

      <div className="space-y-3">
        {wins.map((win, i) => (
          <Card key={i} className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {win.signalName}
                <Badge variant="outline" className="text-[10px] font-normal">
                  {win.effort === 'low' ? 'Easy Fix' : 'Medium Effort'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs">{win.suggestion}</p>
              <p className="text-xs text-muted-foreground">{win.impact}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
