import { demoCandidates, demoEvent, eventSlug } from './demo';
import { supabase } from './supabase';

export interface Candidate {
  n: string;
  name: string;
  city: string;
  votes: number;
  img: string;
  tag: string;
  slug: string;
  bio: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

export interface EventSettings {
  name: string;
  slug: string;
  edition: string;
  subtitle: string;
  heroImage: string;
  rankingVisible: boolean;
  votePriceFcfa: number;
  votesOpen: boolean;
  deadline: string; // e.g. "2026-12-12T20:00"
  competitionDate?: string; // e.g. "12.12"
  socials: SocialLink[];
}

export interface Transaction {
  id: string;
  candidateSlug: string;
  candidateName: string;
  candidateN: string;
  votes: number;
  amountFcfa: number;
  operator: 'MTN Mobile Money' | 'Orange Money';
  phone: string;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

const STORAGE_KEY_CANDIDATES = 'neeovopass_candidates_v1';
const STORAGE_KEY_SETTINGS = 'neeovopass_settings_v1';
const STORAGE_KEY_TRANSACTIONS = 'neeovopass_transactions_v1';
const STORAGE_KEY_AUTH = 'neeovopass_admin_auth_v1';
const EVENT_CHANGE = 'neeovopass_state_updated';

export const defaultSettings: EventSettings = {
  name: 'Miss Lékié',
  slug: eventSlug,
  edition: '2e Édition · 2026',
  subtitle: 'Une célébration de la grâce, de la culture et des femmes qui font rayonner le Cameroun.',
  heroImage: '/miss-likie-hero.jpg',
  rankingVisible: true,
  votePriceFcfa: 100,
  votesOpen: true,
  deadline: '2026-12-12T20:00',
  competitionDate: '12.12',
  socials: [
    { id: 'soc-1', name: 'Instagram', url: 'https://instagram.com', icon: '📸' },
    { id: 'soc-2', name: 'Facebook', url: 'https://facebook.com', icon: '📘' },
    { id: 'soc-3', name: 'TikTok', url: 'https://tiktok.com', icon: '🎵' },
    { id: 'soc-4', name: 'WhatsApp', url: 'https://whatsapp.com', icon: '💬' },
  ],
};

const initialTransactions: Transaction[] = [
  { id: 'TX-94821', candidateSlug: 'merveille-nkoa', candidateName: 'Merveille Nkoa', candidateN: '01', votes: 50, amountFcfa: 5000, operator: 'MTN Mobile Money', phone: '677 •• •• 89', date: 'Aujourd’hui 20:14', status: 'SUCCESS' },
  { id: 'TX-94820', candidateSlug: 'naomi-tchana', candidateName: 'Naomi Tchana', candidateN: '02', votes: 100, amountFcfa: 10000, operator: 'Orange Money', phone: '694 •• •• 12', date: 'Aujourd’hui 19:48', status: 'SUCCESS' },
  { id: 'TX-94819', candidateSlug: 'esther-mbarga', candidateName: 'Esther Mbarga', candidateN: '03', votes: 20, amountFcfa: 2000, operator: 'MTN Mobile Money', phone: '670 •• •• 45', date: 'Aujourd’hui 18:32', status: 'SUCCESS' },
  { id: 'TX-94818', candidateSlug: 'ines-fokam', candidateName: 'Inès Fokam', candidateN: '04', votes: 50, amountFcfa: 5000, operator: 'Orange Money', phone: '699 •• •• 63', date: 'Aujourd’hui 17:15', status: 'SUCCESS' },
  { id: 'TX-94817', candidateSlug: 'merveille-nkoa', candidateName: 'Merveille Nkoa', candidateN: '01', votes: 10, amountFcfa: 1000, operator: 'MTN Mobile Money', phone: '682 •• •• 01', date: 'Aujourd’hui 16:50', status: 'SUCCESS' },
  { id: 'TX-94816', candidateSlug: 'ariane-mbah', candidateName: 'Ariane Mbah', candidateN: '05', votes: 30, amountFcfa: 3000, operator: 'MTN Mobile Money', phone: '675 •• •• 99', date: 'Aujourd’hui 15:22', status: 'SUCCESS' },
  { id: 'TX-94815', candidateSlug: 'sandra-tabe', candidateName: 'Sandra Tabe', candidateN: '06', votes: 15, amountFcfa: 1500, operator: 'Orange Money', phone: '690 •• •• 34', date: 'Aujourd’hui 14:05', status: 'SUCCESS' },
  { id: 'TX-94814', candidateSlug: 'diane-ngono', candidateName: 'Diane Ngono', candidateN: '07', votes: 25, amountFcfa: 2500, operator: 'Orange Money', phone: '696 •• •• 77', date: 'Aujourd’hui 12:40', status: 'SUCCESS' },
];

export function getCandidatePhotoUrl(img: string | undefined): string {
  if (!img || !img.trim()) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
  const s = img.trim();
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/')) {
    return s;
  }
  return `https://images.unsplash.com/${s}?auto=format&fit=crop&w=800&q=80`;
}

export function formatRemainingTime(deadlineStr?: string): string {
  try {
    if (!deadlineStr) return '—';
    const end = new Date(deadlineStr).getTime();
    if (isNaN(end)) return '—';
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Clôturé';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff / 3600000) % 24);
    const mins = Math.floor((diff / 60000) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return `${days}j ${hours}h ${mins}m ${secs}s`;
  } catch {
    return '—';
  }
}

export function getCompetitionDateDisplay(settings?: EventSettings | null): { day: string; month: string; full: string } {
  if (settings?.competitionDate && settings.competitionDate.includes('.')) {
    const parts = settings.competitionDate.split('.');
    return { day: parts[0] || '12', month: '.' + (parts[1] || '12'), full: settings.competitionDate };
  }
  if (settings?.deadline) {
    const d = new Date(settings.deadline);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return { day, month: '.' + month, full: `${day}.${month}` };
    }
  }
  return { day: '12', month: '.12', full: '12.12' };
}

// ============================================================================
// SUPABASE REAL-TIME SYNC
// ============================================================================
let syncInitialized = false;

export function initSupabaseSync(): void {
  if (typeof window === 'undefined' || syncInitialized) return;
  syncInitialized = true;

  // 1. Fetch Candidates from Supabase
  supabase
    .from('candidates')
    .select('*')
    .order('n', { ascending: true })
    .then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: Candidate[] = data.map((c) => ({
          n: c.n,
          name: c.name,
          city: c.city,
          votes: Number(c.votes) || 0,
          img: c.img || '',
          tag: c.tag || '',
          slug: c.slug,
          bio: c.bio || '',
        }));
        localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(mapped));
        window.dispatchEvent(new Event(EVENT_CHANGE));
      }
    })
    .catch((err) => console.warn('Supabase candidates fetch error:', err));

  // 2. Fetch Settings from Supabase
  supabase
    .from('event_settings')
    .select('*')
    .eq('id', 'default')
    .single()
    .then(({ data, error }) => {
      if (!error && data) {
        const s: EventSettings = {
          name: data.name || defaultSettings.name,
          slug: data.slug || defaultSettings.slug,
          edition: data.edition || defaultSettings.edition,
          subtitle: data.subtitle || defaultSettings.subtitle,
          heroImage: data.hero_image || defaultSettings.heroImage,
          rankingVisible: data.ranking_visible ?? defaultSettings.rankingVisible,
          votePriceFcfa: Number(data.vote_price_fcfa) || defaultSettings.votePriceFcfa,
          votesOpen: data.votes_open ?? defaultSettings.votesOpen,
          deadline: data.deadline || defaultSettings.deadline,
          competitionDate: data.competition_date || defaultSettings.competitionDate,
          socials: Array.isArray(data.socials) && data.socials.length > 0 ? data.socials : defaultSettings.socials,
        };
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s));
        window.dispatchEvent(new Event(EVENT_CHANGE));
      }
    })
    .catch((err) => console.warn('Supabase settings fetch error:', err));

  // 3. Fetch Transactions from Supabase
  supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
    .then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length > 0) {
        const txs: Transaction[] = data.map((t) => ({
          id: t.id,
          candidateSlug: t.candidate_slug,
          candidateName: t.candidate_name,
          candidateN: t.candidate_n,
          votes: Number(t.votes) || 1,
          amountFcfa: Number(t.amount_fcfa) || 100,
          operator: t.operator as 'MTN Mobile Money' | 'Orange Money',
          phone: t.phone,
          date: t.date,
          status: t.status as 'SUCCESS' | 'PENDING' | 'FAILED',
        }));
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs));
        window.dispatchEvent(new Event(EVENT_CHANGE));
      }
    })
    .catch((err) => console.warn('Supabase transactions fetch error:', err));

  // 4. Subscribe to Realtime Updates
  try {
    supabase
      .channel('public:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        supabase
          .from('candidates')
          .select('*')
          .order('n', { ascending: true })
          .then(({ data }) => {
            if (data && data.length > 0) {
              const mapped: Candidate[] = data.map((c) => ({
                n: c.n,
                name: c.name,
                city: c.city,
                votes: Number(c.votes) || 0,
                img: c.img || '',
                tag: c.tag || '',
                slug: c.slug,
                bio: c.bio || '',
              }));
              localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(mapped));
              window.dispatchEvent(new Event(EVENT_CHANGE));
            }
          });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_settings' }, () => {
        supabase
          .from('event_settings')
          .select('*')
          .eq('id', 'default')
          .single()
          .then(({ data }) => {
            if (data) {
              const s: EventSettings = {
                name: data.name || defaultSettings.name,
                slug: data.slug || defaultSettings.slug,
                edition: data.edition || defaultSettings.edition,
                subtitle: data.subtitle || defaultSettings.subtitle,
                heroImage: data.hero_image || defaultSettings.heroImage,
                rankingVisible: data.ranking_visible ?? defaultSettings.rankingVisible,
                votePriceFcfa: Number(data.vote_price_fcfa) || defaultSettings.votePriceFcfa,
                votesOpen: data.votes_open ?? defaultSettings.votesOpen,
                deadline: data.deadline || defaultSettings.deadline,
                competitionDate: data.competition_date || defaultSettings.competitionDate,
                socials: Array.isArray(data.socials) ? data.socials : defaultSettings.socials,
              };
              localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s));
              window.dispatchEvent(new Event(EVENT_CHANGE));
            }
          });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            if (data && data.length > 0) {
              const txs: Transaction[] = data.map((t) => ({
                id: t.id,
                candidateSlug: t.candidate_slug,
                candidateName: t.candidate_name,
                candidateN: t.candidate_n,
                votes: Number(t.votes) || 1,
                amountFcfa: Number(t.amount_fcfa) || 100,
                operator: t.operator as 'MTN Mobile Money' | 'Orange Money',
                phone: t.phone,
                date: t.date,
                status: t.status as 'SUCCESS' | 'PENDING' | 'FAILED',
              }));
              localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs));
              window.dispatchEvent(new Event(EVENT_CHANGE));
            }
          });
      })
      .subscribe();
  } catch (err) {
    console.warn('Supabase realtime subscription failed:', err);
  }
}

// Auto-initialize sync on client load
if (typeof window !== 'undefined') {
  initSupabaseSync();
}

// ============================================================================
// STORE GETTERS & PERSISTENCE
// ============================================================================
export function getStoredCandidates(): Candidate[] {
  if (typeof window === 'undefined') return demoCandidates;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CANDIDATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(demoCandidates));
      return demoCandidates;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : demoCandidates;
  } catch {
    return demoCandidates;
  }
}

export function saveStoredCandidates(candidates: Candidate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(candidates));
    window.dispatchEvent(new Event(EVENT_CHANGE));

    // Async sync to Supabase
    Promise.all(
      candidates.map((c) =>
        supabase.from('candidates').upsert(
          {
            n: c.n,
            name: c.name,
            city: c.city,
            votes: c.votes,
            img: c.img,
            tag: c.tag,
            slug: c.slug,
            bio: c.bio || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )
      )
    ).catch((err) => console.error('Supabase candidates upsert error:', err));
  } catch (err) {
    console.error('Failed to save candidates', err);
  }
}

export function deleteStoredCandidate(slug: string): void {
  const current = getStoredCandidates();
  const updated = current.filter((c) => c.slug !== slug);
  saveStoredCandidates(updated);

  supabase
    .from('candidates')
    .delete()
    .eq('slug', slug)
    .then(({ error }) => {
      if (error) console.error('Supabase candidate delete error:', error);
    })
    .catch((err) => console.error(err));
}

export function getStoredSettings(): EventSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      socials: Array.isArray(parsed?.socials) && parsed.socials.length > 0 ? parsed.socials : defaultSettings.socials,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveStoredSettings(settings: EventSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event(EVENT_CHANGE));

    // Async sync to Supabase
    supabase
      .from('event_settings')
      .upsert(
        {
          id: 'default',
          name: settings.name,
          slug: settings.slug,
          edition: settings.edition,
          subtitle: settings.subtitle,
          hero_image: settings.heroImage,
          ranking_visible: settings.rankingVisible,
          vote_price_fcfa: settings.votePriceFcfa,
          votes_open: settings.votesOpen,
          deadline: settings.deadline,
          competition_date: settings.competitionDate,
          socials: settings.socials,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .then(({ error }) => {
        if (error) console.error('Supabase settings upsert error:', error);
      })
      .catch((err) => console.error(err));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return initialTransactions;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(initialTransactions));
      return initialTransactions;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initialTransactions;
  } catch {
    return initialTransactions;
  }
}

export function addStoredTransaction(tx: Omit<Transaction, 'id' | 'date'>): Transaction {
  const current = getStoredTransactions();
  const now = new Date();
  const dateStr = `Aujourd’hui ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const newTx: Transaction = {
    ...tx,
    id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
    date: dateStr,
  };
  const updated = [newTx, ...current];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_CHANGE));

      // Async sync to Supabase
      supabase
        .from('transactions')
        .insert({
          id: newTx.id,
          candidate_slug: newTx.candidateSlug,
          candidate_name: newTx.candidateName,
          candidate_n: newTx.candidateN,
          votes: newTx.votes,
          amount_fcfa: newTx.amountFcfa,
          operator: newTx.operator,
          phone: newTx.phone,
          date: newTx.date,
          status: newTx.status,
        })
        .then(({ error }) => {
          if (error) console.error('Supabase transaction insert error:', error);
        })
        .catch((err) => console.error(err));

      // Increment candidate votes in Supabase
      supabase
        .from('candidates')
        .select('votes')
        .eq('slug', newTx.candidateSlug)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from('candidates')
              .update({ votes: (Number(data.votes) || 0) + newTx.votes })
              .eq('slug', newTx.candidateSlug)
              .then(() => {});
          }
        })
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }
  }

  return newTx;
}

// Authentication
export const ADMIN_CREDENTIALS = {
  id: 'MOVIC',
  pass: '1358',
};

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH) === 'authenticated_movic';
  } catch {
    return false;
  }
}

export function loginAdmin(id: string, pass: string): boolean {
  if (id.trim() === ADMIN_CREDENTIALS.id && pass.trim() === ADMIN_CREDENTIALS.pass) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, 'authenticated_movic');
        localStorage.setItem('neeovopass_admin_user', 'MOVIC');
        window.dispatchEvent(new Event(EVENT_CHANGE));
      } catch (err) {
        console.error(err);
      }
    }
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem('neeovopass_admin_user');
      window.dispatchEvent(new Event(EVENT_CHANGE));
    } catch (err) {
      console.error(err);
    }
  }
}

export function resetAllToDefaults(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(demoCandidates));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(defaultSettings));
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(initialTransactions));
    window.dispatchEvent(new Event(EVENT_CHANGE));
    saveStoredCandidates(demoCandidates);
    saveStoredSettings(defaultSettings);
  } catch (err) {
    console.error(err);
  }
}

export function onStateChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_CHANGE, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT_CHANGE, callback);
    window.removeEventListener('storage', callback);
  };
}
