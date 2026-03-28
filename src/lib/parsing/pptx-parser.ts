import PizZip from 'pizzip';
import { parseStringPromise } from 'xml2js';
import type { ParsedPresentation, ParsedSlide, FontInfo, PresentationMetadata } from '@/types/presentation';

/**
 * Parse a PPTX file buffer into structured slide data.
 * PPTX files are ZIP archives containing XML files for each slide.
 */
export async function parsePptx(buffer: Buffer, fileName: string): Promise<ParsedPresentation> {
  const zip = new PizZip(buffer);

  // Get slide file entries, sorted by slide number
  const slideEntries = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  // Check for chart files
  const chartFiles = Object.keys(zip.files).filter(
    name => /^ppt\/charts\//.test(name)
  );

  // Parse slide relationships to find charts and images per slide
  const slideRels = await parseSlideRelationships(zip, slideEntries);

  // Parse each slide
  const slides: ParsedSlide[] = [];
  for (let i = 0; i < slideEntries.length; i++) {
    const slideXml = zip.file(slideEntries[i])?.asText();
    if (!slideXml) continue;

    const slideData = await parseStringPromise(slideXml, { explicitArray: true });
    const noteXml = zip.file(`ppt/notesSlides/notesSlide${i + 1}.xml`)?.asText();
    const rels = slideRels[i] || { chartCount: 0, imageCount: 0 };

    const slide = extractSlideData(slideData, i + 1, rels, !!noteXml);
    slides.push(slide);
  }

  // Parse layout names
  const templateLayouts = await extractLayoutNames(zip);

  // Aggregate metadata
  const metadata = buildMetadata(slides, chartFiles.length, templateLayouts);

  return {
    fileName,
    fileType: 'pptx',
    totalSlides: slides.length,
    slides,
    metadata,
  };
}

interface SlideRelInfo {
  chartCount: number;
  imageCount: number;
}

async function parseSlideRelationships(
  zip: PizZip,
  slideEntries: string[]
): Promise<SlideRelInfo[]> {
  const results: SlideRelInfo[] = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const relPath = `ppt/slides/_rels/slide${i + 1}.xml.rels`;
    const relXml = zip.file(relPath)?.asText();

    if (!relXml) {
      results.push({ chartCount: 0, imageCount: 0 });
      continue;
    }

    const relData = await parseStringPromise(relXml, { explicitArray: true });
    const relationships = relData?.Relationships?.Relationship || [];

    let chartCount = 0;
    let imageCount = 0;

    for (const rel of relationships) {
      const type = rel?.$?.Type || '';
      if (type.includes('/chart')) chartCount++;
      if (type.includes('/image')) imageCount++;
    }

    results.push({ chartCount, imageCount });
  }

  return results;
}

function extractSlideData(
  slideData: Record<string, unknown>,
  slideNumber: number,
  rels: SlideRelInfo,
  hasNotes: boolean
): ParsedSlide {
  const spTree = getShapeTree(slideData);
  if (!spTree) {
    return emptySlide(slideNumber, rels, hasNotes);
  }

  const shapes = spTree['p:sp'] || [];
  let title: string | null = null;
  let bodyText = '';
  let bulletCount = 0;
  const fonts: FontInfo[] = [];
  const colors: string[] = [];
  let layoutName: string | null = null;

  for (const shape of shapes) {
    const isTitle = checkIsTitle(shape);
    const textContent = extractTextFromShape(shape);
    const shapeFonts = extractFontsFromShape(shape);
    const shapeColors = extractColorsFromShape(shape);

    fonts.push(...shapeFonts);
    colors.push(...shapeColors);

    if (isTitle && textContent.trim()) {
      title = textContent.trim();
    } else if (textContent.trim()) {
      bodyText += (bodyText ? '\n' : '') + textContent.trim();
      bulletCount += countBullets(shape);
    }
  }

  // Check for group shapes
  const groupShapes = spTree['p:grpSp'] || [];
  for (const grp of groupShapes) {
    const nestedShapes = grp['p:sp'] || [];
    for (const shape of nestedShapes) {
      const textContent = extractTextFromShape(shape);
      if (textContent.trim()) {
        bodyText += (bodyText ? '\n' : '') + textContent.trim();
        bulletCount += countBullets(shape);
      }
      fonts.push(...extractFontsFromShape(shape));
      colors.push(...extractColorsFromShape(shape));
    }
  }

  const wordCount = bodyText
    .split(/\s+/)
    .filter(w => w.length > 0).length;

  return {
    slideNumber,
    title,
    bodyText,
    wordCount,
    bulletCount,
    hasChart: rels.chartCount > 0,
    hasImage: rels.imageCount > 0,
    imageCount: rels.imageCount,
    fonts: deduplicateFonts(fonts),
    colors: [...new Set(colors)],
    hasNotes,
    layoutName,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getShapeTree(slideData: any): any {
  return slideData?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkIsTitle(shape: any): boolean {
  const nvSpPr = shape?.['p:nvSpPr']?.[0];
  const nvPr = nvSpPr?.['p:nvPr']?.[0];
  const ph = nvPr?.['p:ph']?.[0];
  if (!ph) return false;

  const phType = ph?.$?.type || '';
  return phType === 'title' || phType === 'ctrTitle';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextFromShape(shape: any): string {
  const txBody = shape?.['p:txBody']?.[0];
  if (!txBody) return '';

  const paragraphs = txBody['a:p'] || [];
  const texts: string[] = [];

  for (const para of paragraphs) {
    const runs = para['a:r'] || [];
    let paraText = '';
    for (const run of runs) {
      const textNodes = run['a:t'] || [];
      paraText += textNodes.join('');
    }
    if (paraText.trim()) {
      texts.push(paraText.trim());
    }
  }

  return texts.join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFontsFromShape(shape: any): FontInfo[] {
  const fonts: FontInfo[] = [];
  const txBody = shape?.['p:txBody']?.[0];
  if (!txBody) return fonts;

  const paragraphs = txBody['a:p'] || [];
  for (const para of paragraphs) {
    const runs = para['a:r'] || [];
    for (const run of runs) {
      const rPr = run['a:rPr']?.[0];
      if (!rPr) continue;

      const latin = rPr['a:latin']?.[0];
      const fontName = latin?.$?.typeface;
      const fontSize = rPr?.$?.sz ? parseInt(rPr.$.sz) / 100 : 0; // sz is in hundredths of a point

      if (fontName) {
        fonts.push({ name: fontName, size: fontSize });
      }
    }
  }

  return fonts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractColorsFromShape(shape: any): string[] {
  const colors: string[] = [];
  const txBody = shape?.['p:txBody']?.[0];
  if (!txBody) return colors;

  const paragraphs = txBody['a:p'] || [];
  for (const para of paragraphs) {
    const runs = para['a:r'] || [];
    for (const run of runs) {
      const rPr = run['a:rPr']?.[0];
      if (!rPr) continue;

      const solidFill = rPr['a:solidFill']?.[0];
      const srgbClr = solidFill?.['a:srgbClr']?.[0];
      if (srgbClr?.$?.val) {
        colors.push(`#${srgbClr.$.val}`);
      }
    }
  }

  return colors;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countBullets(shape: any): number {
  const txBody = shape?.['p:txBody']?.[0];
  if (!txBody) return 0;

  const paragraphs = txBody['a:p'] || [];
  let count = 0;

  for (const para of paragraphs) {
    const pPr = para['a:pPr']?.[0];
    // A paragraph is a bullet if it has text and no explicit buNone
    const hasBuNone = pPr?.['a:buNone'];
    const hasText = (para['a:r'] || []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => (r['a:t'] || []).join('').trim().length > 0
    );

    if (hasText && !hasBuNone && pPr?.['a:buChar']) {
      count++;
    }
  }

  return count;
}

async function extractLayoutNames(zip: PizZip): Promise<string[]> {
  const layoutNames: string[] = [];
  const layoutFiles = Object.keys(zip.files).filter(
    name => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(name)
  );

  for (const layoutFile of layoutFiles) {
    const xml = zip.file(layoutFile)?.asText();
    if (!xml) continue;

    const data = await parseStringPromise(xml, { explicitArray: true });
    const name = data?.['p:sldLayout']?.$?.name;
    if (name) {
      layoutNames.push(name);
    }
  }

  return [...new Set(layoutNames)];
}

function buildMetadata(
  slides: ParsedSlide[],
  totalChartFiles: number,
  templateLayouts: string[]
): PresentationMetadata {
  const allFonts = new Set<string>();
  const allColors = new Set<string>();
  let totalWordCount = 0;
  let totalChartCount = 0;
  let totalImageCount = 0;
  let hasAppendix = false;

  for (const slide of slides) {
    for (const font of slide.fonts) allFonts.add(font.name);
    for (const color of slide.colors) allColors.add(color);
    totalWordCount += slide.wordCount;
    if (slide.hasChart) totalChartCount++;
    totalImageCount += slide.imageCount;

    const titleLower = slide.title?.toLowerCase() || '';
    if (titleLower.includes('appendix') || titleLower.includes('backup') || titleLower.includes('supplemental')) {
      hasAppendix = true;
    }
  }

  return {
    uniqueFonts: [...allFonts],
    uniqueColors: [...allColors],
    totalWordCount,
    totalChartCount: totalChartCount || totalChartFiles,
    totalImageCount,
    hasAppendix,
    templateLayouts,
  };
}

function deduplicateFonts(fonts: FontInfo[]): FontInfo[] {
  const seen = new Map<string, FontInfo>();
  for (const font of fonts) {
    const key = `${font.name}-${font.size}`;
    if (!seen.has(key)) {
      seen.set(key, font);
    }
  }
  return [...seen.values()];
}

function emptySlide(slideNumber: number, rels: SlideRelInfo, hasNotes: boolean): ParsedSlide {
  return {
    slideNumber,
    title: null,
    bodyText: '',
    wordCount: 0,
    bulletCount: 0,
    hasChart: rels.chartCount > 0,
    hasImage: rels.imageCount > 0,
    imageCount: rels.imageCount,
    fonts: [],
    colors: [],
    hasNotes,
    layoutName: null,
  };
}
