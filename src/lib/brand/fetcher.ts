/**
 * Fetches brand details (colors, fonts) from a company website.
 * Uses the website's CSS and meta tags to extract brand information.
 */

export interface BrandDetails {
  colors: string[]; // hex colors found on the site
  fonts: string[]; // font families used
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export async function fetchBrandDetails(websiteUrl: string): Promise<BrandDetails | null> {
  try {
    // Normalize URL
    let url = websiteUrl.trim();
    if (!url.startsWith('http')) url = `https://${url}`;

    // Fetch the website HTML
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StoryProof/1.0; +https://prezent.ai)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract colors from inline styles, CSS variables, and meta tags
    const colors = extractColors(html);
    const fonts = extractFonts(html);
    const logoUrl = extractLogo(html, url);
    const primaryColor = colors[0] || undefined;
    const secondaryColor = colors[1] || undefined;

    // Also try to fetch external CSS for more colors/fonts
    const cssUrls = extractCssUrls(html, url);
    for (const cssUrl of cssUrls.slice(0, 3)) { // limit to 3 CSS files
      try {
        const cssRes = await fetch(cssUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (cssRes.ok) {
          const css = await cssRes.text();
          colors.push(...extractColorsFromCss(css));
          fonts.push(...extractFontsFromCss(css));
        }
      } catch {
        // Skip failed CSS fetches
      }
    }

    // Deduplicate and clean
    const uniqueColors = [...new Set(colors.map(c => c.toUpperCase()))].slice(0, 10);
    const uniqueFonts = [...new Set(fonts)].slice(0, 5);

    return {
      colors: uniqueColors,
      fonts: uniqueFonts,
      logoUrl,
      primaryColor: uniqueColors[0],
      secondaryColor: uniqueColors[1],
    };
  } catch (err) {
    console.error('Brand fetch error:', err);
    return null;
  }
}

function extractColors(html: string): string[] {
  const colors: string[] = [];

  // Extract hex colors from inline styles
  const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const matches = html.match(hexPattern) || [];
  colors.push(...matches);

  // Extract from meta theme-color
  const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
  if (themeColorMatch) colors.unshift(themeColorMatch[1]);

  // Extract from CSS custom properties (common brand color patterns)
  const cssVarPattern = /--(?:primary|brand|main|accent|theme)[^:]*:\s*([^;]+)/gi;
  let match;
  while ((match = cssVarPattern.exec(html)) !== null) {
    const value = match[1].trim();
    if (value.startsWith('#')) colors.push(value);
  }

  // Filter out common non-brand colors (white, black, grays, transparent)
  return colors.filter(c => {
    const upper = c.toUpperCase();
    return !['#FFF', '#FFFFFF', '#000', '#000000', '#333', '#333333', '#666', '#666666', '#999', '#CCC', '#DDD', '#EEE', '#F5F5F5', '#FAFAFA'].includes(upper);
  });
}

function extractFonts(html: string): string[] {
  const fonts: string[] = [];

  // Extract from Google Fonts links
  const gfPattern = /fonts\.googleapis\.com\/css2?\?family=([^"&]+)/g;
  let match;
  while ((match = gfPattern.exec(html)) !== null) {
    const families = decodeURIComponent(match[1]).split('|');
    for (const f of families) {
      fonts.push(f.split(':')[0].replace(/\+/g, ' '));
    }
  }

  // Extract from font-family declarations in inline styles
  const ffPattern = /font-family:\s*['"]?([^;'"]+)/gi;
  while ((match = ffPattern.exec(html)) !== null) {
    const families = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
    fonts.push(...families.filter(f => !['Arial', 'Helvetica', 'sans-serif', 'serif', 'monospace', 'inherit'].includes(f)));
  }

  return fonts;
}

function extractLogo(html: string, baseUrl: string): string | undefined {
  // Try Open Graph image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch) return resolveUrl(ogMatch[1], baseUrl);

  // Try favicon/icon links
  const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i);
  if (iconMatch) return resolveUrl(iconMatch[1], baseUrl);

  return undefined;
}

function extractCssUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const pattern = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    urls.push(resolveUrl(match[1], baseUrl));
  }
  return urls;
}

function extractColorsFromCss(css: string): string[] {
  const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const matches = css.match(hexPattern) || [];
  return matches.filter(c => {
    const upper = c.toUpperCase();
    return !['#FFF', '#FFFFFF', '#000', '#000000', '#333', '#666', '#999', '#CCC', '#DDD', '#EEE'].includes(upper);
  });
}

function extractFontsFromCss(css: string): string[] {
  const fonts: string[] = [];
  const ffPattern = /font-family:\s*['"]?([^;'"}\n]+)/gi;
  let match;
  while ((match = ffPattern.exec(css)) !== null) {
    const families = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
    fonts.push(...families.filter(f =>
      !['Arial', 'Helvetica', 'sans-serif', 'serif', 'monospace', 'inherit', 'initial', 'unset'].includes(f)
    ));
  }
  return fonts;
}

function resolveUrl(path: string, baseUrl: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('//')) return `https:${path}`;
  const base = new URL(baseUrl);
  if (path.startsWith('/')) return `${base.origin}${path}`;
  return `${base.origin}/${path}`;
}
