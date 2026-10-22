import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const revalidate = 300;

const CDN_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(
  request: NextRequest,
  { params }: { params: { candidate: string } }
) {
  const candidateParam = decodeURIComponent(params.candidate || '').trim();

  try {
    // 1. Fetch candidate by slug or candidate number
    const { data: candidate } = await supabase
      .from('candidates')
      .select('name, n, slug, img')
      .or(`slug.eq.${candidateParam},n.eq.${candidateParam}`)
      .maybeSingle();

    const img = candidate?.img?.trim();

    if (img && img.length > 0) {
      // Case A: Base64 data URL (uploaded directly from device)
      if (img.startsWith('data:')) {
        const match = img.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          const contentType = match[1] || 'image/jpeg';
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': buffer.length.toString(),
              'Cache-Control': CDN_CACHE,
            },
          });
        }
      }

      // Case B: Remote HTTP/HTTPS URL (Unsplash, Supabase Storage, CDN)
      if (img.startsWith('http://') || img.startsWith('https://')) {
        try {
          const remoteRes = await fetch(img, { next: { revalidate: 3600 } });
          if (remoteRes.ok) {
            const arrayBuffer = await remoteRes.arrayBuffer();
            const contentType = remoteRes.headers.get('content-type') || 'image/jpeg';
            return new NextResponse(Buffer.from(arrayBuffer), {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': CDN_CACHE,
              },
            });
          }
        } catch (fetchErr) {
          console.warn('Failed to stream remote candidate image, redirecting:', fetchErr);
          return NextResponse.redirect(img, { status: 302 });
        }
      }

      // Case C: Local file path in public/
      if (img.startsWith('/')) {
        const filePath = path.join(process.cwd(), 'public', img.replace(/^\/+/, ''));
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const contentType =
            ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': CDN_CACHE,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Candidate image API error:', error);
  }

  // Fallback to event logo or Neeovopass logo
  try {
    const eventLogoPath = path.join(process.cwd(), 'public', 'miss-beaute-logo.jpeg');
    if (fs.existsSync(eventLogoPath)) {
      const buffer = fs.readFileSync(eventLogoPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': CDN_CACHE,
        },
      });
    }

    const fallbackLogo = path.join(process.cwd(), 'public', 'neeovopass-logo.jpg');
    if (fs.existsSync(fallbackLogo)) {
      const buffer = fs.readFileSync(fallbackLogo);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': CDN_CACHE,
        },
      });
    }
  } catch {}

  return new NextResponse('Candidate photo not found', { status: 404 });
}
