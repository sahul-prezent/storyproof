import { NextRequest } from 'next/server';
import { parsePresentation, type SupportedFileType } from '@/lib/parsing';
import { scorePresentation } from '@/lib/scoring/engine';
import { saveReport } from '@/lib/db/reports';
import { getSupabase } from '@/lib/db/client';
import { createClient } from '@/lib/auth/supabase-server';
import { fetchBrandDetails } from '@/lib/brand/fetcher';
import type { AudienceContext } from '@/types/context';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storagePath, fileName, fileType, context } = body as {
      storagePath: string;
      fileName: string;
      fileType: SupportedFileType;
      context: AudienceContext;
    };

    if (!storagePath || !fileName || !fileType || !context) {
      return Response.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional)
    let userId: string | undefined;
    let userEmail: string | undefined;
    try {
      const supabaseAuth = await createClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      userId = user?.id;
      userEmail = user?.email ?? undefined;
    } catch {
      // Not authenticated — that's fine
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Step 1: Download file from Supabase Storage
          send({ type: 'progress', step: 'parsing', pct: 5 });
          const supabase = getSupabase();
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('uploads')
            .download(storagePath);

          if (downloadError || !fileData) {
            send({ type: 'error', message: 'Failed to retrieve uploaded file.' });
            controller.close();
            return;
          }

          const buffer = Buffer.from(await fileData.arrayBuffer());

          // Step 2: Parse the file
          send({ type: 'progress', step: 'parsing', pct: 10 });
          const presentation = await parsePresentation(buffer, fileName, fileType);

          // Step 2b: Fetch brand details if company website provided
          let brandDetails = undefined;
          if (context.companyWebsite) {
            send({ type: 'progress', step: 'fetching_brand', pct: 13 });
            try {
              brandDetails = await fetchBrandDetails(context.companyWebsite) ?? undefined;
            } catch {
              // Brand fetch failure is non-blocking
            }
          }

          // Step 3: Score with AI
          const result = await scorePresentation(
            presentation,
            context,
            (step, pct) => send({ type: 'progress', step, pct }),
            brandDetails
          );

          // Step 4: Save to database
          send({ type: 'progress', step: 'saving', pct: 95 });

          let reportId: string;
          try {
            reportId = await saveReport({
              fileName,
              fileType,
              slideCount: presentation.totalSlides,
              context,
              result,
              userId,
              userEmail,
            });
          } catch (dbError) {
            console.error('Failed to save report to DB:', dbError);
            reportId = 'local';
          }

          // Step 5: Clean up — delete temp file from storage
          await supabase.storage.from('uploads').remove([storagePath]);

          // Step 6: Complete
          send({
            type: 'complete',
            reportId,
            report: result,
            pct: 100,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'An unexpected error occurred.';
          send({ type: 'error', message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    return Response.json({ error: message }, { status: 500 });
  }
}
