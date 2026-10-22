import './globals.css';
import './detail.css';
import './suspense.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'NEEOVOPASS — Miss Beauté Africaine Lékié 2e Édition',
  description:
    'NEEOVOPASS — Publie. Vends. Fais Voter. Soutenez votre candidate et participez à Miss Beauté Africaine Lékié, concours de beauté et de mode au Cameroun.',
  openGraph: {
    title: 'NEEOVOPASS — Miss Beauté Africaine Lékié 2e Édition',
    description: 'Publie. Vends. Fais Voter. L’élégance, la grâce et la fierté de chez nous.',
    images: ['/neeovopass-logo.jpg'],
  },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="fr"><body>{children}</body></html>; }
