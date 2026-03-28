import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { CriticalIssue } from '@/types/scoring';

interface CriticalIssuesProps {
  issues: CriticalIssue[];
}

export function CriticalIssues({ issues }: CriticalIssuesProps) {
  if (issues.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-500" />
        Top 3 Critical Issues
      </h2>

      <div className="space-y-3">
        {issues.map((issue, i) => (
          <Card key={i} className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {issue.signalName}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {issue.categoryName}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <blockquote className="border-l-2 border-muted pl-3 text-xs text-muted-foreground italic">
                {issue.evidence}
              </blockquote>
              <p className="text-xs text-red-700 dark:text-red-400">
                {issue.businessConsequence}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
