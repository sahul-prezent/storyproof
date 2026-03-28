import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { getSupabase } from '@/lib/db/client';
import { validateFile } from '@/lib/parsing';

// Allow large file uploads
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json(
        { error: 'Expected multipart/form-data upload.' },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      console.error('FormData parse error:', parseErr);
      return Response.json(
        { error: 'Failed to parse file upload. The file may be too large or corrupted.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided.' }, { status: 400 });
    }

    const validation = validateFile(file.name, file.size, file.type);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Generate a unique path
    const ext = file.name.split('.').pop() || 'pptx';
    const fileId = nanoid();
    const storagePath = `temp/${fileId}.${ext}`;

    // Upload to Supabase Storage
    const supabase = getSupabase();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return Response.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      fileId,
      storagePath,
      fileName: file.name,
      fileType: validation.fileType,
      fileSize: file.size,
    });
  } catch (err) {
    console.error('Upload route error:', err);
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
