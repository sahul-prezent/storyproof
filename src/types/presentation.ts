export interface ParsedSlide {
  slideNumber: number;
  title: string | null;
  bodyText: string;
  wordCount: number;
  bulletCount: number;
  hasChart: boolean;
  hasImage: boolean;
  imageCount: number;
  fonts: FontInfo[];
  colors: string[]; // hex values
  hasNotes: boolean;
  layoutName: string | null;
}

export interface FontInfo {
  name: string;
  size: number; // in points
}

export interface PresentationMetadata {
  uniqueFonts: string[];
  uniqueColors: string[];
  totalWordCount: number;
  totalChartCount: number;
  totalImageCount: number;
  hasAppendix: boolean;
  templateLayouts: string[];
}

export interface ParsedPresentation {
  fileName: string;
  fileType: 'pptx' | 'pdf';
  totalSlides: number;
  slides: ParsedSlide[];
  metadata: PresentationMetadata;
}
