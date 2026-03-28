import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { UpsellRecommendation, PrezentProduct } from '@/types/upsell';

interface UpsellSectionProps {
  recommendations: UpsellRecommendation[];
}

const UTM = '?utm_source=storyproof&utm_medium=report&utm_campaign=upsell';

const PRODUCT_URLS: Record<PrezentProduct, string> = {
  prezent_op_service: `https://www.prezent.ai/overnight-presentations${UTM}&utm_content=op_service`,
  prezent_op_full_rebuild: `https://www.prezent.ai/overnight-presentations${UTM}&utm_content=full_rebuild`,
  prezent_platform_story_builder: `https://www.prezent.ai/create/story-builder${UTM}&utm_content=story_builder`,
  prezent_platform_audience_calibrator: `https://www.prezent.ai/presentation-design-services${UTM}&utm_content=audience_calibrator`,
  prezent_platform_slide_simplification: `https://www.prezent.ai/presentation-design-services${UTM}&utm_content=slide_simplification`,
};

export function UpsellSection({ recommendations }: UpsellSectionProps) {
  if (recommendations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        How Prezent Fixes This
      </h2>
      <p className="text-sm text-muted-foreground">
        Based on your specific results, here is how Prezent can help.
      </p>

      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <Card key={i} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {rec.productName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{rec.description}</p>

              {rec.specificIssues.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">Issues this addresses:</p>
                  <ul className="space-y-1">
                    {rec.specificIssues.map((issue, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={PRODUCT_URLS[rec.product]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center h-8 rounded-md border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Learn More
                <ArrowRight className="ml-1 h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
