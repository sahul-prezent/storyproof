import { NextRequest } from 'next/server';
import { fetchBrandDetails } from '@/lib/brand/fetcher';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return Response.json({ error: 'URL is required.' }, { status: 400 });
    }

    const brand = await fetchBrandDetails(url);

    if (!brand) {
      return Response.json(
        { error: 'Could not fetch brand details from that URL.' },
        { status: 400 }
      );
    }

    return Response.json(brand);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch brand.';
    return Response.json({ error: message }, { status: 500 });
  }
}
