'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Candidate,
  EventSettings,
  getStoredCandidates,
  getStoredSettings,
  isAdminAuthenticated,
  onStateChange,
  defaultSettings,
  getCandidatePhotoUrl,
  getCompetitionDateDisplay,
  formatRemainingTime,
} from '@/lib/store';
import { SocialIcon } from '@/components/SocialIcon';
import { eventSlug } from '@/lib/demo';

export default function EventPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<EventSettings>(defaultSettings);
  const [isAdmin, setIsAdmin] = useState(false);
  const [count, setCount] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCandidates(getStoredCandidates());
    const initialSettings = getStoredSettings();
    setSettings(initialSettings);
    setIsAdmin(isAdminAuthenticated());

    const tick = () => {
      const current = getStoredSettings();
      setCount(formatRemainingTime(current?.deadline || '2026-12-12T20:00'));
    };
    tick();
    const timer = setInterval(tick, 1000);

    const unsub = onStateChange(() => {
      setCandidates(getStoredCandidates());
      setSettings(getStoredSettings());
      setIsAdmin(isAdminAuthenticated());
      tick();
    });

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  const maxVotes = useMemo(() => {
    return Math.max(1, ...(candidates.map((c) => c.votes) || [1000]));
  }, [candidates]);

  const compDate = useMemo(() => {
    return getCompetitionDateDisplay(settings);
  }, [settings]);

  if (slug !== eventSlug) {
    return (
      <main className="detail-page">
        <div className="detail-nav">
          <Link href="/" className="footer-brand">
            <img src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
          </Link>
          <Link href="/" className="detail-nav-vote">
            Retour à l’accueil ↗
          </Link>
        </div>
        <div className="not-found">
          <h1>Événement introuvable</h1>
          <p style={{ color: '#aaa', fontSize: 13 }}>L’événement demandé n’existe pas ou a été déplacé.</p>
          <Link href="/" className="button button-gold" style={{ display: 'inline-flex', margin: '10px auto' }}>
            Retourner à l’accueil ↗
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="detail-page">
      {/* NAVIGATION */}
      <header className="detail-nav">
        <Link href="/" className="footer-brand" title="NEEOVOPASS - Accueil">
          <img src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
        </Link>
        <div className="detail-nav-links">
          <Link href="/">Accueil</Link>
          <a href="#candidates">Candidates</a>
          <a href="#classement">Classement</a>
        </div>
        <a href="#candidates" className="detail-nav-vote">
          Voter <span>↗</span>
        </a>
      </header>

      {/* HERO COVER */}
      <section className="event-cover">
        <div
          className="event-cover-bg"
          style={{ backgroundImage: `url('${settings.heroImage || '/miss-likie-hero.jpg'}')` }}
        />
        <div className="event-cover-shade" />

        <div className="event-hero-inner">
          <div className="event-cover-copy">
            <div className="eyebrow">
              <span className="live-dot" /> CONCOURS EN COURS <i></i> {settings.edition?.toUpperCase() || '2E ÉDITION · 2026'}
            </div>
            <p className="edition-label">LA BEAUTÉ DE CHEZ NOUS</p>
            <h1>
              {settings.name?.split(' ')[0] || 'Miss'}
              <br />
              <em>{settings.name?.split(' ').slice(1).join(' ') || 'Lékié'}</em>
              <sup>2</sup>
            </h1>
            <div className="hero-rule" />
            <p className="hero-copy">
              {settings.subtitle ||
                'Une célébration de la grâce, de la culture et des femmes qui font rayonner le Cameroun.'}
            </p>
            <div className="event-hero-actions">
              <a className="button button-gold" href="#candidates">
                Découvrir les candidates <span>↓</span>
              </a>
              <a className="text-link" href="#classement">
                Voir le classement <span>↓</span>
              </a>
            </div>
            <div className="countdown">
              <span className="count-label">CLÔTURE DES VOTES DANS</span>
              <strong>{count || '—'}</strong>
            </div>
          </div>

          <div className="event-hero-seal-wrap">
            <div className="event-date-seal">
              <strong>{compDate.day}</strong>
              <span>{compDate.month?.toUpperCase()}</span>
              <small>{compDate.year || 2026} · FINALE</small>
            </div>
            <div className="event-seal-sub">LÉKIÉ · CAMEROUN</div>
          </div>
        </div>
      </section>

      {/* SECTION L'ÉDITION */}
      <section className="event-about" id="edition">
        <div className="section-kicker">01 / L’ÉDITION OFFICIELLE</div>
        <div className="event-about-grid">
          <h2>
            La beauté de chez nous.
            <br />
            <em>Une histoire à écrire.</em>
          </h2>
          <p>
            Miss Lékié célèbre les femmes qui incarnent l’élégance, l’intelligence et la fierté culturelle du Cameroun.
            Découvrez leurs profils, votez pour votre candidate favorite et contribuez à son sacre vers la couronne.
            <br />
            <br />
            <b>Votes sécurisés par Mobile Money & Orange Money.</b>
          </p>
        </div>
        <div className="event-metrics">
          <div>
            <strong>{String(candidates.length).padStart(2, '0')}</strong>
            <span>CANDIDATES</span>
          </div>
          <div>
            <strong>
              {settings.votePriceFcfa || 100} <small>FCFA</small>
            </strong>
            <span>PAR VOTE</span>
          </div>
          <div>
            <strong>{compDate.full}</strong>
            <span>GRANDE FINALE</span>
          </div>
          <div>
            <strong>01</strong>
            <span>COURONNE</span>
          </div>
        </div>
      </section>

      {/* SECTION CANDIDATES GRID */}
      <section className="candidates-section" id="candidates">
        <div className="section candidates-head">
          <div className="section-kicker">02 / LES PRÉTENDANTES</div>
          <div className="candidate-title-row">
            <h2>
              Qui portera
              <br />
              <em>la couronne ?</em>
            </h2>
            <p>
              Chaque voix compte. Cliquez sur une candidate
              <br className="desktop" /> pour consulter son profil complet et voter.
            </p>
            <a href="#classement" className="all-link">
              VOIR LE CLASSEMENT <span>↓</span>
            </a>
          </div>
          <div className="live-rank">
            <span className="live-dot" /> CLASSEMENT EN DIRECT{' '}
            <span className="rank-updated">
              {settings.rankingVisible ? 'MIS À JOUR EN TEMPS RÉEL' : 'MODE SUSPENSE ACTIF'}
            </span>
          </div>
        </div>

        <div className="candidate-grid">
          {sortedCandidates.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                background: '#121110',
                border: '1px dashed rgba(217, 182, 107, 0.35)',
                borderRadius: '12px',
                margin: '20px 0',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '14px' }}>👑</div>
              <h3 style={{ font: "500 24px 'Playfair Display', serif", color: 'var(--cream)', margin: '0 0 10px' }}>
                Les candidates arrivent très bientôt
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '440px', margin: '0 auto', lineHeight: 1.8 }}>
                La liste officielle des candidates pour Miss Lékié 2ᵉ Édition est en cours de configuration. Les profils seront publiés ici très prochainement !
              </p>
            </div>
          ) : (
            sortedCandidates.map((c, i) => (
              <article className={`candidate-card ${i === 0 ? 'featured' : ''}`} key={c.slug || c.n}>
                <Link
                  href={`/evenement/${eventSlug}/candidate/${c.slug}`}
                  className="candidate-photo"
                  style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}
                  title={`Découvrir le profil de ${c.name}`}
                >
                  <img
                    src={getCandidatePhotoUrl(c.img)}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="candidate-number">N° {c.n}</span>
                  <span className="candidate-tag">{c.tag}</span>
                  <span className="vote-round" aria-label={`Voter pour ${c.name}`}>
                    ↗
                  </span>
                </Link>
                <div className="candidate-info">
                  <div>
                    <Link
                      href={`/evenement/${eventSlug}/candidate/${c.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3>{c.name}</h3>
                    </Link>
                    <p>{c.city}</p>
                  </div>
                  <div className="votes">
                    <strong>{settings.rankingVisible ? c.votes.toLocaleString('fr-FR') : '•••'}</strong>
                    <span>{settings.rankingVisible ? 'VOIX' : 'CONFIDENTIEL'}</span>
                  </div>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: settings.rankingVisible ? `${Math.max(14, (c.votes / maxVotes) * 100)}%` : '50%',
                    }}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* SECTION CLASSEMENT */}
      {settings.rankingVisible ? (
        <section className="event-ranking" id="classement">
          <div className="section-kicker">03 / TABLEAU DES SCORES</div>
          <div className="event-heading">
            <h2>
              La course à
              <br />
              <em>la couronne.</em>
            </h2>
            <p>
              Chaque voix compte. Classement indicatif
              <br />
              mis à jour en temps réel.
            </p>
          </div>
          <div className="ranking-list">
            {sortedCandidates.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#8c857a', fontSize: '13px' }}>
                Aucune candidate inscrite pour le moment.
              </p>
            ) : (
              sortedCandidates.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/evenement/${eventSlug}/candidate/${c.slug}`}
                  className="ranking-row"
                  title={`Voir le profil de ${c.name}`}
                >
                  <span className="rank-num">{String(i + 1).padStart(2, '0')}</span>
                  <img src={getCandidatePhotoUrl(c.img)} alt={c.name} />
                  <span className="rank-name">
                    <b>{c.name}</b>
                    <small>{c.city}</small>
                  </span>
                  <span className="rank-track">
                    <i
                      style={{
                        width: `${Math.max(12, (c.votes / maxVotes) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="rank-votes">
                    {c.votes.toLocaleString('fr-FR')} <small>voix</small>
                  </span>
                  <span className="rank-arrow">↗</span>
                </Link>
              ))
            )}
          </div>
          <div className="event-note">
            <span className="live-dot" /> Données synchronisées en direct avec l’administration NEEOVOPASS
          </div>
        </section>
      ) : (
        <section className="event-suspense" id="classement">
          <div className="suspense-icon">✳</div>
          <div className="section-kicker">MODE SUSPENSE ACTIVÉ</div>
          <h2>
            Le classement reste
            <br />
            <em>une surprise.</em>
          </h2>
          <p>
            Les positions des candidates sont temporairement masquées jusqu’à la clôture officielle des votes. Continuez
            à soutenir votre favorite — chaque voix compte et est rigoureusement comptabilisée.
          </p>
          <span className="suspense-until">RÉSULTATS RÉVÉLÉS À LA GRANDE FINALE · {compDate.full}</span>
        </section>
      )}

      {/* SECTION BOTTOM CTA */}
      <section className="event-bottom-cta">
        <div className="section-kicker">VOTRE VOIX COMPTE</div>
        <h2>Qui sera votre prochaine Miss ?</h2>
        <a className="button button-gold" href="#candidates">
          Choisir une candidate & voter <span>↗</span>
        </a>
      </section>

      {/* FOOTER */}
      <footer className="detail-footer">
        <Link href="/" className="footer-brand" title="NEEOVOPASS">
          <img src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>NEEOVOPASS · MISS LÉKIÉ 2026</span>
          {settings.socials && settings.socials.length > 0 && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {settings.socials.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={soc.name}
                  aria-label={soc.name}
                  className="social-icon-btn"
                  style={{ width: 34, height: 34 }}
                >
                  <SocialIcon name={soc.name} size={16} color="#d9b66b" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <Link href="/">Accueil</Link>
          <a href="#candidates">Haut de page ↑</a>
        </div>
      </footer>
    </main>
  );
}
