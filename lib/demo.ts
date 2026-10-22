export const eventSlug = 'miss-lekie-2e-edition';
// Mirrors events.ranking_visible in the database. Set false to activate suspense mode.
export const demoEvent = { rankingVisible: true };
export const demoCandidates: Array<{
  n: string;
  name: string;
  city: string;
  votes: number;
  img: string;
  tag: string;
  slug: string;
  bio: string;
}> = [];
