import type { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabase';

// Page mise en cache 5 min sur le CDN Vercel : réponse instantanée pour les robots WhatsApp/Facebook
export const dynamic = 'force-static';
export const revalidate = 300;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'https://neeovopass.vercel.app'
).replace(/\/$/, '');

export async function generateMetadata(
  { params }: { params: { slug: string; candidate: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const candidateParam = decodeURIComponent(params.candidate || '').trim();
  const eventName = 'Miss Beauté Africaine Lékié';

  // 1. Fetch candidate from Supabase
  let candidate: { name?: string; n?: string; slug?: string; tag?: string; bio?: string; city?: string; img?: string } | null = null;
  try {
    const { data } = await supabase
      .from('candidates')
      .select('name, n, slug, tag, bio, city')
      .or(`slug.eq.${candidateParam},n.eq.${candidateParam}`)
      .maybeSingle();
    candidate = data;
  } catch (err) {
    console.warn('Metadata candidate fetch error:', err);
  }

  // 2. Domaine du site
  const baseUrl = SITE_URL;

  const pageUrl = `${baseUrl}/evenement/${params.slug}/candidate/${candidateParam}`;

  if (!candidate) {
    return {
      title: `Candidate — ${eventName} 2e Édition`,
      description: `Votez pour votre candidate préférée au concours ${eventName} sur NEEOVOPASS.`,
      openGraph: {
        title: `Candidate — ${eventName} 2e Édition`,
        description: `Votez pour votre candidate préférée au concours ${eventName} sur NEEOVOPASS.`,
        url: pageUrl,
        images: [`${baseUrl}/miss-beaute-logo.jpeg`],
      },
    };
  }

  const candidateName = candidate.name || 'Candidate';
  const candidateNum = candidate.n ? `N° ${candidate.n}` : '';
  const title = `Votez pour ${candidateName} ${candidateNum ? `(${candidateNum})` : ''} — ${eventName}`;
  const description =
    candidate.bio ||
    `Soutenez ${candidateName} ${candidateNum ? `(${candidateNum})` : ''} au concours ${eventName} 2e Édition 2026. Vote officiel et sécurisé dès 100 FCFA sur NEEOVOPASS via MTN MoMo ou Orange Money.`;

  // Always use the dedicated route ending with .jpg which WhatsApp requires
  const imageUrl = `${baseUrl}/api/candidate-image/${candidate.slug || candidateParam}.jpg`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: `NEEOVOPASS · ${eventName}`,
      type: 'profile',
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 800,
          height: 1000,
          type: 'image/jpeg',
          alt: `Photo de ${candidateName} — ${eventName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
