'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Candidate,
  EventSettings,
  getStoredCandidates,
  saveStoredCandidates,
  getStoredSettings,
  addStoredTransaction,
  isAdminAuthenticated,
  onStateChange,
  defaultSettings,
  formatRemainingTime,
  getCandidatePhotoUrl,
} from '@/lib/store';
import { SocialIcon } from '@/components/SocialIcon';
import { eventSlug } from '@/lib/demo';

export default function CandidatePage({
  params,
}: {
  params: { slug: string; candidate: string };
}) {
  const { slug, candidate: cs } = params;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<EventSettings>(defaultSettings);
  const [remainingTime, setRemainingTime] = useState('');
  const [mounted, setMounted] = useState(false);

  const [votes, setVotes] = useState(5);
  const [operator, setOperator] = useState<'MTN Mobile Money' | 'Orange Money'>('MTN Mobile Money');
  const [phone, setPhone] = useState('');
  const [anon, setAnon] = useState(false);
  const [notice, setNotice] = useState(false);
  const [successPayment, setSuccessPayment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCandidates(getStoredCandidates());
    const initialSettings = getStoredSettings();
    setSettings(initialSettings);

    const tick = () => {
      const cur = getStoredSettings();
      setRemainingTime(formatRemainingTime(cur?.deadline || '2026-12-12T20:00'));
    };
    tick();
    const interval = setInterval(tick, 1000);

    const unsub = onStateChange(() => {
      setCandidates(getStoredCandidates());
      setSettings(getStoredSettings());
      tick();
    });

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const c = useMemo(() => {
    return candidates.find((x) => x.slug === cs);
  }, [candidates, cs]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  const currentRank = useMemo(() => {
    if (!c) return 1;
    return sortedCandidates.findIndex((x) => x.slug === c.slug) + 1;
  }, [sortedCandidates, c]);

  if (slug !== eventSlug || (!c && mounted)) {
    return (
      <main className="detail-page">
        <div className="detail-nav">
          <Link href="/">← NEEOVOPASS</Link>
        </div>
        <div className="not-found">
          <h1>Candidate introuvable</h1>
          <Link href={`/evenement/${eventSlug}`}>Voir l’événement ↗</Link>
        </div>
      </main>
    );
  }

  if (!c) return null;

  const setValid = (v: number) => setVotes(Math.max(1, Math.min(5000, Number.isFinite(v) ? Math.floor(v) : 1)));

  const handleConfirmPayment = () => {
    const price = settings.votePriceFcfa || 100;
    const amount = votes * price;

    // 1. Update candidate votes in store
    const updated = candidates.map((item) => {
      if (item.slug === c.slug) {
        return { ...item, votes: item.votes + votes };
      }
      return item;
    });
    saveStoredCandidates(updated);
    setCandidates(updated);

    // 2. Record transaction
    const masked = phone.trim() ? phone.replace(/(\d{3})\d{4}(\d{2})/, '$1••••$2') : '67• •• •• ' + Math.floor(10 + Math.random() * 89);
    addStoredTransaction({
      candidateSlug: c.slug,
      candidateName: c.name,
      candidateN: c.n,
      votes,
      amountFcfa: amount,
      operator,
      phone: masked,
      status: 'SUCCESS',
    });

    setSuccessPayment(true);
    setNotice(false);
  };

  const unitPrice = settings.votePriceFcfa || 100;

  return (
    <main className="detail-page">
      <div className="detail-nav candidate-nav">
        <Link href="/" className="footer-brand" title="NEEOVOPASS - Accueil">
          <img src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
        </Link>
        <Link href={`/evenement/${eventSlug}`} className="candidate-back-event" title="Retourner à l’événement Miss Beauté Africaine Lékié">
          ← MISS BEAUTÉ AFRICAINE LÉKIÉ · 2<sup>e</sup> ÉDITION
        </Link>
        <span className="candidate-nav-badge">PROFIL CANDIDATE</span>
      </div>

      <section className="profile-hero">
        <div
          className="profile-ambient-bg"
          style={{ backgroundImage: `url('${getCandidatePhotoUrl(c.img)}')` }}
        />
        <div className="profile-overlay" />

        <div className="profile-hero-inner">
          <div className="profile-copy">
            <div className="section-kicker">
              CANDIDATE N° {c.n} · {c.city.toUpperCase()}
            </div>
            <h1>
              {c.name.split(' ')[0]}
              <br />
              <em>{c.name.split(' ').slice(1).join(' ')}</em>
            </h1>
            <p>{c.tag} · MISS BEAUTÉ AFRICAINE LÉKIÉ 2026</p>
            <a className="button button-gold" href="#soutenir">
              Soutenir {c.name.split(' ')[0]} <span>↓</span>
            </a>
          </div>

          <div className="profile-image-showcase">
            <div className="profile-image-frame">
              <img
                src={getCandidatePhotoUrl(c.img)}
                alt={c.name}
              />
              <div className="profile-image-tag">N° {c.n}</div>
            </div>
          </div>

          <div className="profile-count">
            <span>{settings.rankingVisible ? 'CLASSEMENT PROVISOIRE' : 'STATUT DU CLASSEMENT'}</span>
            <strong>{settings.rankingVisible ? `#${currentRank}` : 'CONFIDENTIEL'}</strong>
            <small>{settings.rankingVisible ? `${c.votes.toLocaleString('fr-FR')} voix` : 'Mode Suspense'}</small>
            <div
              style={{
                marginTop: 10,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(217, 182, 107, 0.12)',
                border: '1px solid rgba(217, 182, 107, 0.35)',
                color: 'var(--gold)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⏱️</span>
              <span>CLÔTURE DANS :</span>
              <b style={{ color: '#fff' }}>{remainingTime || '—'}</b>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-details">
        <div className="profile-story">
          <div className="section-kicker">SON HISTOIRE</div>
          <h2>
            La beauté,
            <br />
            <em>selon {c.name.split(' ')[0]}.</em>
          </h2>
          <p>{c.bio}</p>
          <p>
            Pour {c.name.split(' ')[0]}, Miss Beauté Africaine Lékié est une occasion de célébrer les parcours singuliers et de partager
            une vision généreuse de la beauté camerounaise. Soutenez son aventure et faites entendre votre voix.
          </p>
          <div className="profile-social">
            <span>PARTAGER SON AVENTURE</span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }
              }}
              style={{
                background: copiedLink ? '#22c55e' : undefined,
                color: copiedLink ? '#000' : undefined,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {copiedLink ? '✓ Lien copié !' : 'Copier le lien ↗'}
            </button>
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(
                `Votez pour ${c.name} (N° ${c.n}) au concours Miss Beauté Africaine Lékié 2026 !\nCliquez ici pour soutenir sa candidature :\n${
                  typeof window !== 'undefined' ? window.location.href : ''
                }`
              )}`}
              className="social-icon-btn"
              style={{ width: 34, height: 34 }}
              title="Partager sur WhatsApp"
            >
              <SocialIcon name="WhatsApp" size={17} color="#d9b66b" />
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.href : ''
              )}`}
              className="social-icon-btn"
              style={{ width: 34, height: 34 }}
              title="Partager sur Facebook"
            >
              <SocialIcon name="Facebook" size={17} color="#d9b66b" />
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Je soutiens ${c.name} (N° ${c.n}) pour Miss Beauté Africaine Lékié 2026 !`
              )}&url=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.href : ''
              )}`}
              className="social-icon-btn"
              style={{ width: 34, height: 34 }}
              title="Partager sur X (Twitter)"
            >
              <SocialIcon name="X (Twitter)" size={17} color="#d9b66b" />
            </a>
          </div>
        </div>

        <aside className="vote-box" id="soutenir">
          <div className="section-kicker">VOTER POUR {c.name.split(' ')[0].toUpperCase()}</div>
          <h3>
            Votre soutien
            <br />
            <em>fait la différence.</em>
          </h3>
          <div
            style={{
              background: 'rgba(217, 182, 107, 0.08)',
              border: '1px solid rgba(217, 182, 107, 0.28)',
              padding: '10px 14px',
              borderRadius: 8,
              margin: '14px 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ color: '#d9b66b', fontWeight: 600, letterSpacing: '0.08em' }}>
              ⏱️ CLÔTURE DES VOTES :
            </span>
            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{remainingTime || '—'}</strong>
          </div>
          <p className="vote-price">
            1 vote <b>{unitPrice} FCFA</b>
          </p>

          <label className="input-label" htmlFor="vote-count">
            NOMBRE DE VOTES
          </label>
          <div className="vote-stepper">
            <button aria-label="Retirer un vote" onClick={() => setValid(votes - 1)}>
              −
            </button>
            <input
              id="vote-count"
              inputMode="numeric"
              type="number"
              min="1"
              max="5000"
              value={votes}
              onChange={(e) => setValid(+e.target.value)}
            />
            <button aria-label="Ajouter un vote" onClick={() => setValid(votes + 1)}>
              ＋
            </button>
          </div>

          <div className="quick-votes">
            {[5, 10, 50, 100].map((n) => (
              <button
                className={votes === n ? 'selected' : ''}
                key={n}
                onClick={() => setValid(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <label className="input-label">OPÉRATEUR DE PAIEMENT</label>
          <div className="operator-choice">
            <button
              className={operator === 'MTN Mobile Money' ? 'active' : ''}
              onClick={() => setOperator('MTN Mobile Money')}
            >
              <span className="operator-dot mtn" />
              MTN MoMo
            </button>
            <button
              className={operator === 'Orange Money' ? 'active' : ''}
              onClick={() => setOperator('Orange Money')}
            >
              <span className="operator-dot orange" />
              Orange Money
            </button>
          </div>

          <label className="input-label" htmlFor="phone">
            NUMÉRO {operator === 'MTN Mobile Money' ? 'MTN MOMO' : 'ORANGE MONEY'}
          </label>
          <input
            className="phone-input"
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="6XX XX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label className="anon-check">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            <span>Rester anonyme dans le fil des soutiens</span>
          </label>

          <div className="total-row">
            <span>TOTAL À PAYER</span>
            <strong>
              {(votes * unitPrice).toLocaleString('fr-FR')} <small>FCFA</small>
            </strong>
          </div>

          <button className="button button-gold pay-button" onClick={handleConfirmPayment}>
            Confirmer et Voter ({votes} voix) <span>↗</span>
          </button>

          <p className="secure-note">
            Paiement sécurisé Mobile Money (MTN MoMo &amp; Orange Money) · Enregistrement instantané.
          </p>

          {successPayment && (
            <div
              className="demo-notice"
              role="status"
              style={{
                borderColor: '#4ade80',
                background: 'rgba(74, 222, 128, 0.1)',
                color: '#fff',
                marginTop: 15,
              }}
            >
              <b style={{ color: '#4ade80' }}>🎉 Vote validé avec succès !</b>
              <span>
                +{votes} voix ont été enregistrées pour {c.name}. Merci pour votre soutien !
              </span>
              <button onClick={() => setSuccessPayment(false)} style={{ background: '#4ade80', color: '#0c0b0a' }}>
                Fermer
              </button>
            </div>
          )}
        </aside>
      </section>

      <footer className="detail-footer">
        <Link href="/" className="footer-brand">
          <img src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span>NEEOVOPASS · MISS BEAUTÉ AFRICAINE LÉKIÉ 2026</span>
          {settings.socials && settings.socials.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {settings.socials.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={soc.name}
                  aria-label={soc.name}
                  className="social-icon-btn"
                  style={{ width: 32, height: 32 }}
                >
                  <SocialIcon name={soc.name} size={15} color="#d9b66b" />
                </a>
              ))}
            </div>
          )}
        </div>
        <Link href={`/evenement/${eventSlug}`}>Retour à l’événement ↑</Link>
      </footer>
    </main>
  );
}
