'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Candidate,
  EventSettings,
  SocialLink,
  Transaction,
  getStoredCandidates,
  saveStoredCandidates,
  getStoredSettings,
  saveStoredSettings,
  getStoredTransactions,
  addStoredTransaction,
  isAdminAuthenticated,
  logoutAdmin,
  resetAllToDefaults,
  onStateChange,
  formatRemainingTime,
  getCandidatePhotoUrl,
} from '@/lib/store';
import { SocialIcon } from '@/components/SocialIcon';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './admin.css';

const DEFAULT_DISTINCTIONS = [
  'Grâce & Élégance',
  'Coup de cœur',
  'Charisme & Présence',
  'Audace & Détermination',
  'Authenticité & Tradition',
  'Rayonnement culturel',
  'Inspiration & Leadership',
  'Créativité & Modernité',
  'Sourire & Douceur',
  'Fierté Lékié',
  'Élégance naturelle',
  'Personnalité rayonnante',
  'Dynamisme & Jeunesse',
  'Ambassadrice de charme',
  'Beauté & Valeurs',
  'Étoile montante',
];

function getDefaultDistinctionForNumber(num: number | string): string {
  const n = parseInt(String(num).trim(), 10);
  if (isNaN(n) || n <= 0) return DEFAULT_DISTINCTIONS[0];
  return DEFAULT_DISTINCTIONS[(n - 1) % DEFAULT_DISTINCTIONS.length];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'transactions' | 'settings'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Social links form state
  const [newSocialName, setNewSocialName] = useState('Instagram');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialIcon, setNewSocialIcon] = useState('📸');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorFilter, setOperatorFilter] = useState<'ALL' | 'MTN' | 'ORANGE'>('ALL');

  // Candidate Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formCandidate, setFormCandidate] = useState<{
    n: string;
    name: string;
    city: string;
    tag: string;
    votes: number;
    img: string;
    bio: string;
  }>({
    n: '',
    name: '',
    city: '',
    tag: '',
    votes: 0,
    img: '',
    bio: '',
  });

  // Manual Date Fields
  const [manualDay, setManualDay] = useState(12);
  const [manualMonth, setManualMonth] = useState(12);
  const [manualYear, setManualYear] = useState(2026);
  const [manualHour, setManualHour] = useState(20);
  const [manualMinute, setManualMinute] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadData = () => {
    setCandidates(getStoredCandidates());
    const s = getStoredSettings();
    setSettings(s);
    if (s?.deadline) {
      const d = new Date(s.deadline);
      if (!isNaN(d.getTime())) {
        setManualDay(d.getDate());
        setManualMonth(d.getMonth() + 1);
        setManualYear(d.getFullYear());
        setManualHour(d.getHours());
        setManualMinute(d.getMinutes());
      }
    }
    setTransactions(getStoredTransactions());
  };

  useEffect(() => {
    setMounted(true);
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    loadData();
    const unsub = onStateChange(loadData);
    return () => unsub();
  }, [router]);

  // Derived metrics
  const totalVotes = useMemo(() => {
    return candidates.reduce((acc, c) => acc + (c.votes || 0), 0);
  }, [candidates]);

  const totalRevenue = useMemo(() => {
    const price = settings?.votePriceFcfa || 100;
    return totalVotes * price;
  }, [totalVotes, settings]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return sortedCandidates;
    const q = searchQuery.toLowerCase();
    return sortedCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.n.includes(q) ||
        c.tag.toLowerCase().includes(q)
    );
  }, [sortedCandidates, searchQuery]);

  // Chart data
  const barChartData = useMemo(() => {
    return sortedCandidates.map((c) => ({
      name: c.name.split(' ')[0],
      fullName: c.name,
      votes: c.votes,
      n: c.n,
    }));
  }, [sortedCandidates]);

  const pieChartData = useMemo(() => {
    let mtnVotes = 0;
    let orangeVotes = 0;
    transactions.forEach((tx) => {
      if (tx.operator === 'MTN Mobile Money') mtnVotes += tx.votes;
      else orangeVotes += tx.votes;
    });
    if (mtnVotes === 0 && orangeVotes === 0) {
      mtnVotes = 58;
      orangeVotes = 42;
    }
    return [
      { name: 'MTN Mobile Money', value: mtnVotes, color: '#f59e0b' },
      { name: 'Orange Money', value: orangeVotes, color: '#ea580c' },
    ];
  }, [transactions]);

  // Actions
  const handleLogout = () => {
    logoutAdmin();
    router.push('/admin/login');
  };

  const handleQuickAddVotes = (candidateSlug: string, count: number) => {
    const updated = candidates.map((c) => {
      if (c.slug === candidateSlug) {
        return { ...c, votes: c.votes + count };
      }
      return c;
    });
    saveStoredCandidates(updated);
    setCandidates(updated);

    const target = candidates.find((c) => c.slug === candidateSlug);
    if (target) {
      const price = settings?.votePriceFcfa || 100;
      addStoredTransaction({
        candidateSlug: target.slug,
        candidateName: target.name,
        candidateN: target.n,
        votes: count,
        amountFcfa: count * price,
        operator: Math.random() > 0.5 ? 'MTN Mobile Money' : 'Orange Money',
        phone: '67• •• •• ' + Math.floor(10 + Math.random() * 89),
        status: 'SUCCESS',
      });
    }

    showToast(`+${count} voix ajoutées pour ${target?.name || 'la candidate'}`);
  };

  const compressImageToDataUrl = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result;
        if (typeof src !== 'string') {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("L'image dépasse 15 Mo. Veuillez choisir une photo plus légère.");
        return;
      }
      showToast('Optimisation de la photo...');
      const dataUrl = await compressImageToDataUrl(file, 1080, 1350, 0.85);
      if (dataUrl) {
        setFormCandidate((prev) => ({ ...prev, img: dataUrl }));
        showToast('Photo de la candidate importée avec succès !');
      }
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("L'image dépasse 15 Mo. Veuillez choisir une image plus légère.");
        return;
      }
      showToast('Optimisation de la bannière Hero...');
      const dataUrl = await compressImageToDataUrl(file, 1920, 1080, 0.85);
      if (dataUrl) {
        handleUpdateEventInfo({ heroImage: dataUrl });
        showToast('Bannière Hero importée et enregistrée !');
      }
    }
  };

  const handleManualDateChange = (d: number, m: number, y: number, h: number, min: number) => {
    setManualDay(d);
    setManualMonth(m);
    setManualYear(y);
    setManualHour(h);
    setManualMinute(min);
    const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
    const isoString = `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`;
    const compDate = `${pad(d)}.${pad(m)}`;
    handleUpdateDeadline(isoString, compDate);
  };

  const handleOpenAddModal = () => {
    setEditingCandidate(null);
    const nextIdx = candidates.length + 1;
    const nextNum = String(nextIdx).padStart(2, '0');
    setFormCandidate({
      n: nextNum,
      name: '',
      city: '',
      tag: getDefaultDistinctionForNumber(nextIdx),
      votes: 10,
      img: '',
      bio: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Candidate) => {
    setEditingCandidate(c);
    setFormCandidate({
      n: c.n,
      name: c.name,
      city: c.city,
      tag: c.tag,
      votes: c.votes,
      img: c.img,
      bio: c.bio || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveCandidateModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate.name.trim()) return;

    if (editingCandidate) {
      const updated = candidates.map((c) => {
        if (c.slug === editingCandidate.slug) {
          return {
            ...c,
            n: formCandidate.n,
            name: formCandidate.name,
            city: formCandidate.city,
            tag: formCandidate.tag,
            votes: Number(formCandidate.votes),
            img: formCandidate.img,
            bio: formCandidate.bio,
          };
        }
        return c;
      });
      saveStoredCandidates(updated);
      setCandidates(updated);
      showToast(`Candidate "${formCandidate.name}" mise à jour avec succès.`);
    } else {
      const slug = formCandidate.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const newCand: Candidate = {
        n: formCandidate.n,
        name: formCandidate.name,
        city: formCandidate.city || 'Yaoundé · Centre',
        tag: formCandidate.tag || 'Coup de cœur',
        votes: Number(formCandidate.votes) || 0,
        img:
          formCandidate.img ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        slug,
        bio: formCandidate.bio || `${formCandidate.name} porte avec fierté les couleurs de sa région pour Miss Lékié.`,
      };
      const updated = [...candidates, newCand];
      saveStoredCandidates(updated);
      setCandidates(updated);
      showToast(`Nouvelle candidate "${formCandidate.name}" ajoutée !`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCandidate = (slug: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer "${name}" du concours ?`)) {
      const updated = candidates.filter((c) => c.slug !== slug);
      saveStoredCandidates(updated);
      setCandidates(updated);
      showToast(`Candidate "${name}" supprimée.`);
    }
  };

  const handleToggleSuspenseMode = () => {
    if (!settings) return;
    const nextVal = !settings.rankingVisible;
    const updated = { ...settings, rankingVisible: nextVal };
    saveStoredSettings(updated);
    setSettings(updated);
    showToast(nextVal ? 'Classement public visible en direct' : 'Mode Suspense activé (classement masqué)');
  };

  const handleToggleVotesOpen = () => {
    if (!settings) return;
    const nextVal = !settings.votesOpen;
    const updated = { ...settings, votesOpen: nextVal };
    saveStoredSettings(updated);
    setSettings(updated);
    showToast(nextVal ? 'Les votes sont désormais OUVERTS' : 'Les votes sont désormais SUSPENDUS');
  };

  const handleUpdatePrice = (newPrice: number) => {
    if (!settings || newPrice <= 0) return;
    const updated = { ...settings, votePriceFcfa: newPrice };
    saveStoredSettings(updated);
    setSettings(updated);
    showToast(`Prix du vote mis à jour : ${newPrice} FCFA`);
  };

  const handleUpdateDeadline = (newDate: string, compDate?: string) => {
    if (!settings || !newDate) return;
    const d = new Date(newDate);
    const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
    const derivedCompDate =
      compDate || (!isNaN(d.getTime()) ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}` : settings.competitionDate);
    const updated = { ...settings, deadline: newDate, competitionDate: derivedCompDate };
    saveStoredSettings(updated);
    setSettings(updated);
    if (!isNaN(d.getTime())) {
      setManualDay(d.getDate());
      setManualMonth(d.getMonth() + 1);
      setManualYear(d.getFullYear());
      setManualHour(d.getHours());
      setManualMinute(d.getMinutes());
    }
    showToast(`Date mise à jour : ${newDate.replace('T', ' à ')} (Finale : ${derivedCompDate})`);
  };

  const handleUpdateEventInfo = (fields: Partial<EventSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...fields };
    saveStoredSettings(updated);
    setSettings(updated);
    showToast('Paramètres sauvegardés avec succès.');
  };

  const handleAddSocialLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings || !newSocialUrl.trim()) {
      showToast('Veuillez entrer une adresse URL valide pour le réseau social.');
      return;
    }
    const newLink: SocialLink = {
      id: `soc-${Date.now()}`,
      name: newSocialName,
      url: newSocialUrl.trim(),
      icon: newSocialIcon,
    };
    const updated = { ...settings, socials: [...(settings.socials || []), newLink] };
    saveStoredSettings(updated);
    setSettings(updated);
    setNewSocialUrl('');
    showToast(`Réseau social "${newSocialName}" ajouté au pied de page !`);
  };

  const handleRemoveSocialLink = (id: string) => {
    if (!settings) return;
    const target = settings.socials?.find((s) => s.id === id);
    const updated = { ...settings, socials: (settings.socials || []).filter((s) => s.id !== id) };
    saveStoredSettings(updated);
    setSettings(updated);
    showToast(`Lien "${target?.name || 'Réseau'}" retiré du pied de page.`);
  };

  const handleResetDefaults = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données (candidates, votes, paramètres) aux valeurs initiales ?')) {
      resetAllToDefaults();
      loadData();
      showToast('Données réinitialisées avec succès aux valeurs officielles.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand">
            <img src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
            <div className="sidebar-brand-title">
              NEEOVO<span>PASS</span>
            </div>
          </Link>
          <span className="sidebar-badge">ADMIN</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Tableau de bord</div>
          <button
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
          >
            <span className="sidebar-item-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ display: 'block' }}
              >
                <rect x="3" y="12" width="4.5" height="9" rx="1.5" opacity="0.75" />
                <rect x="9.75" y="4" width="4.5" height="17" rx="1.5" />
                <rect x="16.5" y="8" width="4.5" height="13" rx="1.5" opacity="0.9" />
              </svg>
            </span>
            <span>Vue d’ensemble</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('candidates');
              setMobileMenuOpen(false);
            }}
          >
            <span className="sidebar-item-icon">👑</span>
            <span>Gestion Candidates ({candidates.length})</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('transactions');
              setMobileMenuOpen(false);
            }}
          >
            <span className="sidebar-item-icon">💳</span>
            <span>Votes & Transactions</span>
          </button>

          <div className="sidebar-section-title" style={{ marginTop: 14 }}>
            Configuration
          </div>
          <button
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
          >
            <span className="sidebar-item-icon">⚙️</span>
            <span>Paramètres Concours</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-avatar">M</div>
            <div className="admin-user-info">
              <span className="admin-user-name">MOVIC</span>
              <span className="admin-user-role">Super Administrateur</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              ☰
            </button>
            <div className="topbar-breadcrumb">
              Admin &gt;{' '}
              <strong>
                {activeTab === 'overview' && 'Vue d’ensemble'}
                {activeTab === 'candidates' && 'Candidates & Votes'}
                {activeTab === 'transactions' && 'Transactions Mobile Money'}
                {activeTab === 'settings' && 'Paramètres du Concours'}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="live-indicator">
              <span className="pulse-dot" />
              <span>LIVE · SYSTÈME ACTIF</span>
            </div>
            <Link href="/" target="_blank" className="topbar-public-link">
              <span>Site Public</span>
              <span>↗</span>
            </Link>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="admin-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="content-header">
                <div className="content-title-wrap">
                  <h2>Tableau de bord Général</h2>
                  <p>Pilotage en temps réel du concours Miss Lékié · 2e Édition 2026</p>
                </div>
                <div className="header-actions">
                  <button className="btn-secondary" onClick={handleToggleSuspenseMode}>
                    {settings?.rankingVisible ? '🎭 Activer Mode Suspense' : '👁️ Révéler le Classement'}
                  </button>
                  <button className="btn-gold" onClick={handleOpenAddModal}>
                    ＋ Nouvelle Candidate
                  </button>
                </div>
              </div>

              {/* KPI CARDS */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-card-glow" />
                  <div className="kpi-top">
                    <span className="kpi-label">TOTAL DES VOIX</span>
                    <span className="kpi-icon">🗳️</span>
                  </div>
                  <div className="kpi-value">
                    {totalVotes.toLocaleString('fr-FR')}
                    <small>voix</small>
                  </div>
                  <div className="kpi-bottom">
                    <span className="kpi-badge-positive">↑ +14.2%</span>
                    <span>depuis hier</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-glow" />
                  <div className="kpi-top">
                    <span className="kpi-label">RECETTES TOTALES</span>
                    <span className="kpi-icon">💰</span>
                  </div>
                  <div className="kpi-value">
                    {totalRevenue.toLocaleString('fr-FR')}
                    <small>FCFA</small>
                  </div>
                  <div className="kpi-bottom">
                    <span>Base tarifaire : {settings?.votePriceFcfa || 100} F / vote</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-glow" />
                  <div className="kpi-top">
                    <span className="kpi-label">CANDIDATES EN LICE</span>
                    <span className="kpi-icon">👑</span>
                  </div>
                  <div className="kpi-value">
                    {candidates.length}
                    <small>prétendantes</small>
                  </div>
                  <div className="kpi-bottom">
                    <span>En tête : {sortedCandidates[0]?.name || '—'}</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-glow" />
                  <div className="kpi-top">
                    <span className="kpi-label">AFFICHAGE PUBLIC</span>
                    <span className="kpi-icon">✨</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.45rem' }}>
                    {settings?.rankingVisible ? 'En direct' : 'Mode Suspense'}
                  </div>
                  <div className="kpi-bottom">
                    <span style={{ color: settings?.rankingVisible ? '#4ade80' : '#d9b66b' }}>
                      {settings?.rankingVisible ? '● Voix visibles' : '● Classement masqué'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CHARTS */}
              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h3>Classement des Votes par Candidate</h3>
                      <span>TEMPS RÉEL · DONNÉES SYNCHRONISÉES</span>
                    </div>
                  </div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#a8a092', fontSize: 11 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: '#a8a092', fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="admin-recharts-tooltip">
                                  <p>
                                    N° {d.n} · {d.fullName}
                                  </p>
                                  <span>{d.votes.toLocaleString('fr-FR')} voix</span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="votes" fill="#d9b66b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <h3>Canaux de Paiement</h3>
                      <span>RÉPARTITION MOBILE MONEY</span>
                    </div>
                  </div>
                  <div className="chart-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                        <span>MTN MoMo (58%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ea580c' }} />
                        <span>Orange Money (42%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK PODIUM TABLE */}
              <div className="panel-card">
                <div className="panel-card-head">
                  <h3>Top 3 Prétendantes Actuelles</h3>
                  <button className="btn-secondary" onClick={() => setActiveTab('candidates')}>
                    Gérer toutes les candidates ↗
                  </button>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>RANG</th>
                        <th>CANDIDATE</th>
                        <th>VOIX</th>
                        <th>AJOUT RAPIDE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCandidates.slice(0, 3).map((c, idx) => (
                        <tr key={c.slug}>
                          <td style={{ fontWeight: 700, color: '#d9b66b', fontSize: '1.1rem' }}>
                            #{idx + 1}
                          </td>
                          <td>
                            <div className="candidate-cell">
                              <img
                                className="candidate-avatar"
                                src={getCandidatePhotoUrl(c.img)}
                                alt={c.name}
                              />
                              <div className="candidate-meta">
                                <span className="candidate-meta-name">
                                  N° {c.n} · {c.name}
                                </span>
                                <span className="candidate-meta-city">{c.city}</span>
                              </div>
                            </div>
                          </td>
                          <td className="vote-counter-cell">
                            {c.votes.toLocaleString('fr-FR')} <small>voix</small>
                          </td>
                          <td>
                            <div className="quick-vote-actions">
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 10)}>
                                +10
                              </button>
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 50)}>
                                +50
                              </button>
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 100)}>
                                +100
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="table-row-actions">
                              <button className="btn-icon-action" onClick={() => handleOpenEditModal(c)}>
                                Modifier
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATES */}
          {activeTab === 'candidates' && (
            <div>
              <div className="content-header">
                <div className="content-title-wrap">
                  <h2>Gestion des Candidates</h2>
                  <p>Ajoutez, modifiez ou ajustez les voix des candidates en temps réel</p>
                </div>
                <div className="header-actions">
                  <button className="btn-gold" onClick={handleOpenAddModal}>
                    ＋ Ajouter une Candidate
                  </button>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-card-head">
                  <div className="search-and-filter">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Rechercher par nom, ville..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#9e978b' }}>
                      {filteredCandidates.length} candidate(s)
                    </span>
                  </div>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>RANG</th>
                        <th>CANDIDATE</th>
                        <th>DISTINCTION</th>
                        <th>VOIX</th>
                        <th>AJUSTER LES VOIX</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((c, idx) => (
                        <tr key={c.slug}>
                          <td style={{ fontWeight: 700, color: idx < 3 ? '#d9b66b' : '#a8a092' }}>
                            #{idx + 1}
                          </td>
                          <td>
                            <div className="candidate-cell">
                              <img
                                className="candidate-avatar"
                                src={getCandidatePhotoUrl(c.img)}
                                alt={c.name}
                              />
                              <div className="candidate-meta">
                                <span className="candidate-meta-name">
                                  N° {c.n} · {c.name}
                                </span>
                                <span className="candidate-meta-city">{c.city}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="tag-badge">{c.tag}</span>
                          </td>
                          <td className="vote-counter-cell">
                            {c.votes.toLocaleString('fr-FR')} <small>voix</small>
                          </td>
                          <td>
                            <div className="quick-vote-actions">
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 5)}>
                                +5
                              </button>
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 20)}>
                                +20
                              </button>
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 50)}>
                                +50
                              </button>
                              <button className="quick-vote-btn" onClick={() => handleQuickAddVotes(c.slug, 100)}>
                                +100
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="table-row-actions">
                              <button className="btn-icon-action" onClick={() => handleOpenEditModal(c)}>
                                Modifier
                              </button>
                              <button
                                className="btn-icon-action danger"
                                onClick={() => handleDeleteCandidate(c.slug, c.name)}
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div>
              <div className="content-header">
                <div className="content-title-wrap">
                  <h2>Journal des Votes & Transactions</h2>
                  <p>Historique des règlements enregistrés via MTN Mobile Money et Orange Money</p>
                </div>
                <div className="header-actions">
                  <button
                    className="btn-gold"
                    onClick={() => {
                      const randCand = candidates[Math.floor(Math.random() * candidates.length)];
                      if (randCand) {
                        handleQuickAddVotes(randCand.slug, 25);
                      }
                    }}
                  >
                    ⚡ Simuler un Vote Mobile Money
                  </button>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-card-head">
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className={`btn-secondary ${operatorFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setOperatorFilter('ALL')}
                    >
                      Tous
                    </button>
                    <button
                      className={`btn-secondary ${operatorFilter === 'MTN' ? 'active' : ''}`}
                      onClick={() => setOperatorFilter('MTN')}
                    >
                      MTN MoMo
                    </button>
                    <button
                      className={`btn-secondary ${operatorFilter === 'ORANGE' ? 'active' : ''}`}
                      onClick={() => setOperatorFilter('ORANGE')}
                    >
                      Orange Money
                    </button>
                  </div>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>RÉFÉRENCE</th>
                        <th>CANDIDATE</th>
                        <th>NOMBRE DE VOIX</th>
                        <th>MONTANT</th>
                        <th>OPÉRATEUR</th>
                        <th>NUMÉRO</th>
                        <th>DATE / HEURE</th>
                        <th>STATUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((tx) => {
                          if (operatorFilter === 'MTN') return tx.operator === 'MTN Mobile Money';
                          if (operatorFilter === 'ORANGE') return tx.operator === 'Orange Money';
                          return true;
                        })
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td style={{ fontFamily: 'monospace', color: '#d9b66b', fontWeight: 600 }}>
                              {tx.id}
                            </td>
                            <td>
                              <strong>{tx.candidateName}</strong>{' '}
                              <span style={{ fontSize: '0.75rem', color: '#a8a092' }}>(N° {tx.candidateN})</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>+{tx.votes} voix</td>
                            <td style={{ fontWeight: 700, color: '#fff' }}>
                              {tx.amountFcfa.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background:
                                    tx.operator === 'MTN Mobile Money'
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(234, 88, 12, 0.15)',
                                  color: tx.operator === 'MTN Mobile Money' ? '#fbbf24' : '#fb923c',
                                }}
                              >
                                {tx.operator}
                              </span>
                            </td>
                            <td style={{ color: '#a8a092', fontSize: '0.8rem' }}>{tx.phone}</td>
                            <td style={{ color: '#a8a092', fontSize: '0.8rem' }}>{tx.date}</td>
                            <td>
                              <span
                                style={{
                                  color: '#4ade80',
                                  background: 'rgba(74, 222, 128, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                SUCCÈS
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && settings && (
            <div>
              <div className="content-header">
                <div className="content-title-wrap">
                  <h2>Paramètres du Concours</h2>
                  <p>Configurez les règles d’affichage, le tarif des votes et la visibilité publique</p>
                </div>
                <div className="header-actions">
                  <button className="btn-secondary danger" onClick={handleResetDefaults}>
                    🔄 Réinitialiser Données Démo
                  </button>
                </div>
              </div>

              <div className="settings-grid">
                {/* PANEL 1: DATE & COMPTE À REBOURS */}
                <div className="panel-card">
                  <div className="panel-card-head">
                    <h3>📅 Date de Clôture & Compte à Rebours</h3>
                  </div>
                  <div className="setting-info" style={{ marginBottom: 16 }}>
                    <span className="setting-desc">
                      Configurez la date et l’heure de clôture officielle. Le temps restant est calculé en direct
                      et affiché sur la page d’accueil ainsi que sur la page de chaque candidate.
                    </span>
                  </div>

                  {/* MODIFICATION MANUELLE DÉTAILLÉE */}
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SAISIE MANUELLE DIRECTE (JOUR / MOIS / ANNÉE / HEURE / MINUTE)</span>
                      <span style={{ color: '#d9b66b', fontSize: '0.75rem' }}>GMT+1</span>
                    </label>
                    <div className="manual-date-row">
                      <div className="manual-date-col">
                        <label htmlFor="m-day">Jour</label>
                        <input
                          id="m-day"
                          type="number"
                          min="1"
                          max="31"
                          className="manual-date-input"
                          value={manualDay}
                          onChange={(e) =>
                            handleManualDateChange(
                              Number(e.target.value),
                              manualMonth,
                              manualYear,
                              manualHour,
                              manualMinute
                            )
                          }
                        />
                      </div>
                      <div className="manual-date-col">
                        <label htmlFor="m-month">Mois</label>
                        <input
                          id="m-month"
                          type="number"
                          min="1"
                          max="12"
                          className="manual-date-input"
                          value={manualMonth}
                          onChange={(e) =>
                            handleManualDateChange(
                              manualDay,
                              Number(e.target.value),
                              manualYear,
                              manualHour,
                              manualMinute
                            )
                          }
                        />
                      </div>
                      <div className="manual-date-col">
                        <label htmlFor="m-year">Année</label>
                        <input
                          id="m-year"
                          type="number"
                          min="2024"
                          max="2035"
                          className="manual-date-input"
                          value={manualYear}
                          onChange={(e) =>
                            handleManualDateChange(
                              manualDay,
                              manualMonth,
                              Number(e.target.value),
                              manualHour,
                              manualMinute
                            )
                          }
                        />
                      </div>
                      <div className="manual-date-col">
                        <label htmlFor="m-hour">Heure</label>
                        <input
                          id="m-hour"
                          type="number"
                          min="0"
                          max="23"
                          className="manual-date-input"
                          value={manualHour}
                          onChange={(e) =>
                            handleManualDateChange(
                              manualDay,
                              manualMonth,
                              manualYear,
                              Number(e.target.value),
                              manualMinute
                            )
                          }
                        />
                      </div>
                      <div className="manual-date-col">
                        <label htmlFor="m-min">Minute</label>
                        <input
                          id="m-min"
                          type="number"
                          min="0"
                          max="59"
                          className="manual-date-input"
                          value={manualMinute}
                          onChange={(e) =>
                            handleManualDateChange(
                              manualDay,
                              manualMonth,
                              manualYear,
                              manualHour,
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="deadline-input">
                      OU SÉLECTION VIA LE SÉLECTEUR DE CALENDRIER
                    </label>
                    <input
                      id="deadline-input"
                      type="datetime-local"
                      className="admin-input"
                      style={{ fontSize: '0.95rem', color: '#d9b66b', fontWeight: 600 }}
                      value={settings.deadline ? settings.deadline.slice(0, 16) : '2026-12-12T20:00'}
                      onChange={(e) => handleUpdateDeadline(e.target.value)}
                    />
                  </div>

                  {/* CHAMP DIRECT DATE DE LA COMPÉTITION (12.12) */}
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label
                      className="form-label"
                      htmlFor="comp-date-input"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>DATE AFFICHÉE DE LA GRANDE FINALE (EX : 12.12)</span>
                      <span style={{ color: '#d9b66b', fontSize: '0.75rem', fontWeight: 700 }}>
                        ACTUELLEMENT : {settings.competitionDate || '12.12'}
                      </span>
                    </label>
                    <input
                      id="comp-date-input"
                      type="text"
                      className="admin-input"
                      value={settings.competitionDate || '12.12'}
                      onChange={(e) => handleUpdateEventInfo({ competitionDate: e.target.value })}
                      placeholder="Ex : 12.12 ou 20.12 ou 15 Décembre"
                      style={{ fontSize: '1rem', color: '#d9b66b', fontWeight: 700, letterSpacing: '0.05em' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#a8a092', marginTop: 5, display: 'block' }}>
                      Cette date s’affiche directement dans les bandeaux « GRANDE FINALE » de la page d’accueil et des événements.
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(217, 182, 107, 0.1)',
                      border: '1px solid rgba(217, 182, 107, 0.3)',
                      padding: '12px 16px',
                      borderRadius: 10,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: '#d9b66b', fontWeight: 600, letterSpacing: '0.1em' }}>
                      ⏱️ TEMPS RESTANT CALCULÉ EN DIRECT :
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: '#fff', letterSpacing: '0.05em' }}>
                      {formatRemainingTime(settings.deadline)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleUpdateDeadline('2026-12-12T20:00')}
                    >
                      12 Déc 2026 à 20:00
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const d = new Date(Date.now() + 7 * 86400000);
                        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        handleUpdateDeadline(iso);
                      }}
                    >
                      + 7 jours
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const d = new Date(Date.now() + 30 * 86400000);
                        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        handleUpdateDeadline(iso);
                      }}
                    >
                      + 30 jours
                    </button>
                  </div>
                </div>

                {/* PANEL 2: BRANDING & IMAGE HERO */}
                <div className="panel-card">
                  <div className="panel-card-head">
                    <h3>👑 Nom de l’Événement & Image Hero</h3>
                  </div>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" htmlFor="event-name">
                      NOM DU CONCOURS
                    </label>
                    <input
                      id="event-name"
                      type="text"
                      className="admin-input"
                      value={settings.name || ''}
                      onChange={(e) => handleUpdateEventInfo({ name: e.target.value })}
                      placeholder="Ex : Miss Lékié"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" htmlFor="event-edition">
                      ÉDITION / SOUS-TITRE
                    </label>
                    <input
                      id="event-edition"
                      type="text"
                      className="admin-input"
                      value={settings.edition || ''}
                      onChange={(e) => handleUpdateEventInfo({ edition: e.target.value })}
                      placeholder="Ex : 2e Édition · 2026"
                    />
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(217, 182, 107, 0.4)',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <label className="form-label" style={{ margin: 0, color: '#f3ede2', fontWeight: 600 }}>
                        IMAGE DE LA SECTION HERO (BANNIÈRE PRINCIPALE)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#a8a092' }}>
                        Visible sur mobile, tablette et ordinateur
                      </span>
                    </div>

                    {/* Aperçu Grande Bannière Hero */}
                    <div
                      style={{
                        height: 140,
                        borderRadius: 10,
                        backgroundImage: `url('${settings.heroImage || '/miss-likie-hero.jpg'}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1.5px solid rgba(217, 182, 107, 0.5)',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(90deg, rgba(12,11,10,0.85) 0%, rgba(12,11,10,0.4) 60%, transparent 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          paddingLeft: 20,
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#d9b66b', textTransform: 'uppercase' }}>
                          Aperçu en direct
                        </span>
                        <strong style={{ fontSize: '1.15rem', color: '#fff', marginTop: 2, fontFamily: "'Playfair Display', serif" }}>
                          {settings.name || 'Miss Lékié'}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#c5beb1', marginTop: 2 }}>
                          {settings.edition || 'Édition Officielle'}
                        </span>
                      </div>
                    </div>

                    {/* Boutons d'action et importation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <label
                        className="btn-gold"
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 18px',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          borderRadius: 8,
                        }}
                      >
                        📁 Choisir une photo depuis mon appareil (Téléphone / PC)
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleHeroFileUpload}
                        />
                      </label>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleUpdateEventInfo({ heroImage: '/miss-likie-hero.jpg' })}
                        title="Rétablir la photo officielle d'origine"
                        style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                      >
                        🔄 Image officielle par défaut
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          handleUpdateEventInfo({
                            heroImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1920&q=85',
                          })
                        }
                        style={{ padding: '9px 14px', fontSize: '0.8rem' }}
                      >
                        ✨ Studio Doré
                      </button>
                    </div>

                    {/* Champ URL direct */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <label htmlFor="hero-img-input" style={{ fontSize: '0.72rem', color: '#d9b66b', letterSpacing: '0.08em' }}>
                        OU SAISIR DIRECTEMENT L’URL DE L’IMAGE :
                      </label>
                      <input
                        id="hero-img-input"
                        type="text"
                        className="admin-input"
                        value={settings.heroImage || '/miss-likie-hero.jpg'}
                        onChange={(e) => handleUpdateEventInfo({ heroImage: e.target.value })}
                        placeholder="Ex : /miss-likie-hero.jpg ou URL https://..."
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* PANEL 3: RÉSEAUX SOCIAUX PIED DE PAGE */}
                <div className="panel-card">
                  <div className="panel-card-head">
                    <h3>🌐 Réseaux Sociaux du Pied de Page</h3>
                    <span style={{ fontSize: '0.75rem', color: '#a8a092' }}>
                      {(settings.socials || []).length} lien(s) actif(s)
                    </span>
                  </div>
                  <p className="setting-desc" style={{ marginBottom: 14 }}>
                    Ajoutez ou supprimez les liens de réseaux sociaux affichés dans le pied de page du site.
                  </p>

                  {/* LISTE DES RÉSEAUX ACTUELS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {(settings.socials || []).length === 0 ? (
                      <div style={{ color: '#9e978b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Aucun réseau social configuré. Ajoutez-en un ci-dessous.
                      </div>
                    ) : (
                      settings.socials.map((soc) => (
                        <div
                          key={soc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="social-icon-btn" style={{ width: 34, height: 34, flexShrink: 0 }}>
                              <SocialIcon name={soc.name} size={17} color="#d9b66b" />
                            </div>
                            <div>
                              <b style={{ color: '#fff', fontSize: '0.85rem' }}>{soc.name}</b>
                              <div style={{ fontSize: '0.72rem', color: '#a8a092' }}>{soc.url}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-icon-action danger"
                            onClick={() => handleRemoveSocialLink(soc.id)}
                            title="Supprimer ce réseau"
                          >
                            Supprimer ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* FORMULAIRE D'AJOUT */}
                  <div
                    style={{
                      background: 'rgba(217, 182, 107, 0.05)',
                      padding: 14,
                      borderRadius: 10,
                      border: '1px dashed rgba(217, 182, 107, 0.25)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#d9b66b',
                        display: 'block',
                        marginBottom: 10,
                      }}
                    >
                      AJOUTER UN NOUVEAU RÉSEAU SOCIAL
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 140px 1fr auto', gap: 10, alignItems: 'center' }}>
                      <div className="social-icon-btn" style={{ width: 38, height: 38, flexShrink: 0 }}>
                        <SocialIcon name={newSocialName} size={18} color="#d9b66b" />
                      </div>
                      <select
                        className="admin-input"
                        value={newSocialName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewSocialName(val);
                        }}
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="TikTok">TikTok</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="X (Twitter)">X (Twitter)</option>
                        <option value="YouTube">YouTube</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Snapchat">Snapchat</option>
                        <option value="Site Web">Site Web</option>
                      </select>
                      <input
                        type="url"
                        placeholder="https://..."
                        className="admin-input"
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                      />
                      <button type="button" className="btn-gold" onClick={handleAddSocialLink}>
                        ＋ Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* PANEL 4: AFFICHAGE, SUSPENSE & TARIF */}
                <div className="panel-card">
                  <div className="panel-card-head">
                    <h3>⚡ Règles de Vote & Affichage</h3>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-title">Mode Suspense (Classement masqué)</span>
                      <span className="setting-desc">
                        Quand activé, les voix et positions des candidates sont masquées sur le site public
                        pour maintenir le suspense jusqu’à la grande finale.
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!settings.rankingVisible}
                        onChange={handleToggleSuspenseMode}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-title">Statut des votes en ligne</span>
                      <span className="setting-desc">
                        Autoriser les utilisateurs à soumettre des votes et effectuer des paiements Mobile Money.
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.votesOpen}
                        onChange={handleToggleVotesOpen}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-title">Prix unitaire du vote (FCFA)</span>
                      <span className="setting-desc">
                        Montant prélevé par voix (actuellement {settings.votePriceFcfa} FCFA).
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[50, 100, 200, 500].map((p) => (
                        <button
                          key={p}
                          className={`btn-secondary ${settings.votePriceFcfa === p ? 'active' : ''}`}
                          style={{
                            background: settings.votePriceFcfa === p ? '#d9b66b' : undefined,
                            color: settings.votePriceFcfa === p ? '#0c0b0a' : undefined,
                            fontWeight: settings.votePriceFcfa === p ? 700 : undefined,
                          }}
                          onClick={() => handleUpdatePrice(p)}
                        >
                          {p} F
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CANDIDATE ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCandidate ? `Modifier ${editingCandidate.name}` : 'Ajouter une Candidate'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCandidateModal} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cand-n">
                    N°
                  </label>
                  <input
                    id="cand-n"
                    type="text"
                    className="admin-input"
                    value={formCandidate.n}
                    onChange={(e) => {
                      const newN = e.target.value;
                      const shouldAutoTag = !formCandidate.tag || DEFAULT_DISTINCTIONS.includes(formCandidate.tag);
                      setFormCandidate({
                        ...formCandidate,
                        n: newN,
                        tag: shouldAutoTag ? getDefaultDistinctionForNumber(newN) : formCandidate.tag,
                      });
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cand-name">
                    Nom & Prénom
                  </label>
                  <input
                    id="cand-name"
                    type="text"
                    className="admin-input"
                    placeholder="Ex : Sarah Eboumbou"
                    value={formCandidate.name}
                    onChange={(e) => setFormCandidate({ ...formCandidate, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="cand-city">
                    Ville / Région
                  </label>
                  <input
                    id="cand-city"
                    type="text"
                    className="admin-input"
                    placeholder="Ex : Monatélé · Centre"
                    value={formCandidate.city}
                    onChange={(e) => setFormCandidate({ ...formCandidate, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" htmlFor="cand-tag" style={{ margin: 0 }}>
                      Distinction / Titre
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormCandidate({ ...formCandidate, tag: getDefaultDistinctionForNumber(formCandidate.n) })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-gold, #d9b66b)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                      title="Attribuer la distinction par défaut selon le N°"
                    >
                      Suggérer pour N° {formCandidate.n || '?'}
                    </button>
                  </div>

                  {/* Dropdown list of distinctions */}
                  <select
                    className="admin-input"
                    style={{ marginBottom: 8, cursor: 'pointer', background: '#1c1b18', color: '#f3ede2' }}
                    value={DEFAULT_DISTINCTIONS.includes(formCandidate.tag) ? formCandidate.tag : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setFormCandidate({ ...formCandidate, tag: e.target.value });
                      }
                    }}
                  >
                    <option value="" disabled>-- Choisir une distinction dans la liste --</option>
                    {DEFAULT_DISTINCTIONS.map((dist, idx) => (
                      <option key={dist} value={dist}>
                        {idx + 1}. {dist} {String(idx + 1).padStart(2, '0') === String(formCandidate.n).padStart(2, '0') ? '★ (suggéré pour ce N°)' : ''}
                      </option>
                    ))}
                    <option value="custom">✏️ Personnalisé (saisie libre ci-dessous)</option>
                  </select>

                  {/* Free text input */}
                  <input
                    id="cand-tag"
                    type="text"
                    className="admin-input"
                    placeholder="Ex : Charme & Audace"
                    value={formCandidate.tag}
                    onChange={(e) => setFormCandidate({ ...formCandidate, tag: e.target.value })}
                    required
                  />

                  {/* Quick pills badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxHeight: 72, overflowY: 'auto' }}>
                    {DEFAULT_DISTINCTIONS.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setFormCandidate({ ...formCandidate, tag: d })}
                        style={{
                          fontSize: '0.68rem',
                          padding: '3px 8px',
                          borderRadius: 999,
                          border: formCandidate.tag === d ? '1px solid #d9b66b' : '1px solid rgba(255,255,255,0.12)',
                          background: formCandidate.tag === d ? 'rgba(217,182,107,0.2)' : 'rgba(255,255,255,0.04)',
                          color: formCandidate.tag === d ? '#d9b66b' : '#b8b0a2',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cand-votes">
                  Nombre de voix initial
                </label>
                <input
                  id="cand-votes"
                  type="number"
                  min="0"
                  className="admin-input"
                  value={formCandidate.votes}
                  onChange={(e) => setFormCandidate({ ...formCandidate, votes: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Photo de la candidate</span>
                  <span style={{ fontSize: '0.72rem', color: '#a8a092' }}>Fichier local ou URL web</span>
                </label>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(217, 182, 107, 0.35)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* Live Preview */}
                    <div
                      style={{
                        width: 80,
                        height: 100,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '2px solid #d9b66b',
                        background: '#0c0b0a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                      }}
                    >
                      {formCandidate.img ? (
                        <img
                          src={getCandidatePhotoUrl(formCandidate.img)}
                          alt="Aperçu"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '2rem', opacity: 0.4 }}>👤</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 200 }}>
                      {/* Upload Button */}
                      <label
                        className="btn-gold"
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          width: 'fit-content',
                          padding: '8px 16px',
                        }}
                      >
                        📁 Importer depuis mon appareil
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handlePhotoFileUpload}
                        />
                      </label>
                      <span style={{ fontSize: '0.75rem', color: '#a8a092' }}>
                        Formats acceptés : JPG, PNG, WEBP (Max 5 Mo)
                      </span>
                    </div>
                  </div>

                  {/* URL Text Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.72rem', color: '#d9b66b', letterSpacing: '0.08em' }}>
                      OU COLLER DIRECTEMENT L’URL DE L’IMAGE :
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Ex : https://mon-site.com/photo.jpg ou /candidate-x.jpg"
                        className="admin-input"
                        value={formCandidate.img}
                        onChange={(e) => setFormCandidate({ ...formCandidate, img: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                      {formCandidate.img && (
                        <button
                          type="button"
                          className="btn-secondary danger"
                          onClick={() => setFormCandidate({ ...formCandidate, img: '' })}
                          title="Effacer la photo"
                          style={{ padding: '0 12px', flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cand-bio">
                  Biographie / Présentation
                </label>
                <textarea
                  id="cand-bio"
                  rows={3}
                  className="admin-input"
                  placeholder="Présentation de la candidate..."
                  value={formCandidate.bio}
                  onChange={(e) => setFormCandidate({ ...formCandidate, bio: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-gold">
                  {editingCandidate ? 'Enregistrer les modifications' : 'Créer la candidate ↗'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTICE */}
      {toastMessage && (
        <div className="toast-notice">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
