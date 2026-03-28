import type { ParsedPresentation, ParsedSlide } from '@/types/presentation';

/**
 * Parse a PDF file buffer into structured slide data.
 * PDF parsing is less rich than PPTX — we extract text per page
 * but cannot reliably detect fonts, colors, charts, or images.
 */
export async function parsePdf(buffer: Buffer, fileName: string): Promise<ParsedPresentation> {
  const { PDFParse } = await import('pdf-parse');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new PDFParse({ data: new Uint8Array(buffer) }) as any;

  // Use public API to get info and text
  const info = await parser.getInfo();
  const totalPages: number = info?.pages || 1;

  const textResult = await parser.getText();
  await parser.destroy();

  // Extract page texts from the result
  const pageTexts: string[] = extractPageTexts(textResult, totalPages);

  const slides: ParsedSlide[] = pageTexts.slice(0, totalPages).map((pageText: string, index: number) => {
    const lines = pageText.split('\n').filter((l: string) => l.trim().length > 0);
    const title = extractTitleHeuristic(lines);
    const bodyText = title
      ? lines.slice(1).join('\n').trim()
      : lines.join('\n').trim();
    const wordCount = bodyText.split(/\s+/).filter((w: string) => w.length > 0).length;

    return {
      slideNumber: index + 1,
      title,
      bodyText,
      wordCount,
      bulletCount: countBulletLines(lines),
      hasChart: false,
      hasImage: false,
      imageCount: 0,
      fonts: [],
      colors: [],
      hasNotes: false,
      layoutName: null,
    };
  });

  const totalWordCount = slides.reduce((sum, s) => sum + s.wordCount, 0);

  return {
    fileName,
    fileType: 'pdf',
    totalSlides: totalPages,
    slides,
    metadata: {
      uniqueFonts: [],
      uniqueColors: [],
      totalWordCount,
      totalChartCount: 0,
      totalImageCount: 0,
      hasAppendix: slides.some(
        s =>
          (s.title?.toLowerCase() || '').includes('appendix') ||
          (s.title?.toLowerCase() || '').includes('backup')
      ),
      templateLayouts: [],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPageTexts(textResult: any, totalPages: number): string[] {
  const pageTexts: string[] = [];

  if (textResult?.pages && Array.isArray(textResult.pages)) {
    for (const page of textResult.pages) {
      pageTexts.push(typeof page === 'string' ? page : String(page));
    }
  } else {
    const fullText = typeof textResult === 'string'
      ? textResult
      : textResult?.text || '';
    const parts = fullText.split('\f').filter((p: string) => p.trim());
    if (parts.length > 0) {
      pageTexts.push(...parts);
    } else {
      // Last resort: split evenly by line count
      const lines = fullText.split('\n');
      const linesPerPage = Math.ceil(lines.length / Math.max(totalPages, 1));
      for (let i = 0; i < totalPages; i++) {
        const start = i * linesPerPage;
        const end = Math.min(start + linesPerPage, lines.length);
        pageTexts.push(lines.slice(start, end).join('\n'));
      }
    }
  }

  while (pageTexts.length < totalPages) {
    pageTexts.push('');
  }

  return pageTexts;
}

function extractTitleHeuristic(lines: string[]): string | null {
  if (lines.length === 0) return null;
  const firstLine = lines[0].trim();
  if (firstLine.length < 100 && !firstLine.includes('. ')) {
    return firstLine;
  }
  return null;
}

function countBulletLines(lines: string[]): number {
  const bulletPattern = /^\s*[•\-–—*▸▹►◆◇○●■□→]\s/;
  return lines.filter(l => bulletPattern.test(l)).length;
}
