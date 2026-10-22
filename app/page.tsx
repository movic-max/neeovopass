'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Candidate,
  EventSettings,
  getStoredCandidates,
  getStoredSettings,
  isAdminAuthenticated,
  onStateChange,
  defaultSettings,
  formatRemainingTime,
  getCandidatePhotoUrl,
  getCompetitionDateDisplay,
} from '@/lib/store';
import { SocialIcon } from '@/components/SocialIcon';

function Photo({ id, alt }: { id: string; alt: string }) {
  return (
    <img
      src={getCandidatePhotoUrl(id)}
      alt={alt}
    />
  );
}

export default function Home() {
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
    const x = setInterval(tick, 1000);

    const unsub = onStateChange(() => {
      setCandidates(getStoredCandidates());
      const s = getStoredSettings();
      setSettings(s);
      setIsAdmin(isAdminAuthenticated());
      tick();
    });

    return () => {
      unsub();
      clearInterval(x);
    };
  }, []);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  const top3 = useMemo(() => {
    return sortedCandidates.slice(0, 3);
  }, [sortedCandidates]);

  const maxVotes = useMemo(() => {
    return Math.max(1, ...(candidates.map((c) => c.votes) || [1000]));
  }, [candidates]);

  const compDate = useMemo(() => {
    return getCompetitionDateDisplay(settings);
  }, [settings]);

  return (
    <main>
      {/* HEADER NAVBAR */}
      <header className="nav">
        <a className="brand" href="#top">
          <img className="brand-logo" src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
          <span>
            NEEOVO<span className="gold">PASS</span>
          </span>
        </a>

        <nav>
          <a href="#edition">L’édition</a>
          <a href="#candidates">Les candidates</a>
          <a href="#how">Comment voter</a>
        </nav>

        <div className="nav-actions">
          <Link
            href={isAdmin ? '/admin' : '/admin/login'}
            className={`nav-login ${isAdmin ? 'logged-in' : ''}`}
            title="Connexion"
          >
            <span className="nav-login-icon">🔒</span>
            <span>Connexion</span>
          </Link>

          <a href="#candidates" className="nav-cta">
            Voter <span>↗</span>
          </a>
        </div>

        <button className="menu" aria-label="Ouvrir le menu">
          ☰
        </button>
      </header>

      {/* HERO SECTION */}
      <section id="top" className="hero">
        <div
          className="hero-image"
          style={{ backgroundImage: `url('${settings.heroImage || '/miss-likie-hero.jpg'}')` }}
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot" /> CONCOURS EN COURS <i></i> LÉKIÉ · CAMEROUN
          </div>
          <p className="edition-label">LA BEAUTÉ DE CHEZ NOUS</p>
          <h1>
            {settings.name?.split(' ')[0] || 'Miss'}
            <br />
            <em>{settings.name?.split(' ').slice(1).join(' ') || 'Beauté Africaine Lékié'}</em>
            <sup>2</sup>
          </h1>
          <div className="hero-rule" />
          <p className="hero-copy">
            {settings.subtitle ||
              'Une célébration de la grâce, de la culture et des femmes qui font rayonner le Cameroun.'}
          </p>
          <div className="hero-actions">
            <a className="button button-gold" href="#candidates">
              Soutenir votre Miss <span>↗</span>
            </a>
            <a className="text-link" href="#edition">
              Découvrir l’édition <span>↓</span>
            </a>
          </div>
          <div className="countdown">
            <span className="count-label">CLÔTURE DES VOTES DANS</span>
            <strong>{count || '—'}</strong>
          </div>
        </div>
        <div className="hero-caption">
          <span>ÉDITION 2026</span>
          <span>01 — {String(candidates.length).padStart(2, '0')}</span>
        </div>
        <div className="vertical-note">ÉLÉGANCE · CULTURE · FIERTÉ</div>
        <div className="hero-seal">
          <span>
            LA COURONNE
            <br />
            VOUS ATTEND
          </span>
          <b>✳</b>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div>
          LA BEAUTÉ DE CHEZ NOUS <span>✳</span> SOUTENEZ VOTRE MISS <span>✳</span> MADE IN CAMEROON <span>✳</span>{' '}
          LA BEAUTÉ DE CHEZ NOUS <span>✳</span> SOUTENEZ VOTRE MISS <span>✳</span> MADE IN CAMEROON <span>✳</span>
        </div>
      </div>

      {/* INTRO SECTION */}
      <section className="section intro" id="edition">
        <div className="section-kicker">01 / L’ÉDITION</div>
        <div className="intro-grid">
          <div>
            <h2>
              Plus qu’un concours.
              <br />
              <em>Une signature.</em>
            </h2>
          </div>
          <div className="intro-text">
            <p>
              Au cœur du département de la Lékié, une nouvelle génération de femmes porte haut les couleurs de notre
              héritage. Huit candidates, une couronne, et toute une communauté derrière elles.
            </p>
            <a className="under-link" href="#how">
              L’histoire de l’édition <span>↗</span>
            </a>
          </div>
        </div>
        <div className="stats-strip">
          <div>
            <strong>{String(candidates.length || 8).padStart(2, '0')}</strong>
            <span>CANDIDATES</span>
          </div>
          <div>
            <strong>
              02<small>e</small>
            </strong>
            <span>ÉDITION</span>
          </div>
          <div>
            <strong>
              {settings.votePriceFcfa || 100} <small>F</small>
            </strong>
            <span>LE VOTE</span>
          </div>
          <div>
            <strong>
              {compDate.day}<span className="stat-month">{compDate.month}</span>
            </strong>
            <span>GRANDE FINALE</span>
          </div>
        </div>
      </section>

      {/* CANDIDATES SECTION */}
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
              Chaque voix compte. Choisissez votre candidate
              <br className="desktop" /> et faites la différence.
            </p>
            <a href="#candidates" className="all-link">
              TOUTES LES CANDIDATES <span>↗</span>
            </a>
          </div>
          <div className="live-rank">
            <span className="live-dot" /> CLASSEMENT EN DIRECT{' '}
            <span className="rank-updated">
              {settings.rankingVisible ? 'MIS À JOUR À L’INSTANT' : 'MODE SUSPENSE ACTIF'}
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
                La liste officielle des candidates pour Miss Beauté Africaine Lékié 2ᵉ Édition est en cours de configuration. Les profils seront publiés ici très prochainement !
              </p>
            </div>
          ) : (
            sortedCandidates.map((c, i) => (
              <article className={`candidate-card ${i === 0 ? 'featured' : ''}`} key={c.slug || c.n}>
                <Link
                  href={`/evenement/miss-lekie-2e-edition/candidate/${c.slug}`}
                  className="candidate-photo"
                  style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}
                  title={`Découvrir le profil de ${c.name}`}
                >
                  <Photo id={c.img} alt={c.name} />
                  <span className="candidate-number">N° {c.n}</span>
                  <span className="candidate-tag">{c.tag}</span>
                  <span className="vote-round" aria-label={`Voter pour ${c.name}`}>
                    ↗
                  </span>
                </Link>
                <div className="candidate-info">
                  <div>
                    <Link
                      href={`/evenement/miss-lekie-2e-edition/candidate/${c.slug}`}
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

        <div className="center-action">
          <a href="#how" className="button button-outline">
            Découvrir les {candidates.length} candidates <span>↗</span>
          </a>
        </div>
      </section>

      {/* PODIUM SECTION */}
      {settings.rankingVisible && top3.length >= 3 && (
        <section className="podium-section">
          <div className="section">
            <div className="section-kicker">03 / LA COURSE À LA COURONNE</div>
            <div className="podium-heading">
              <div>
                <h2>
                  Le podium
                  <br />
                  <em>provisoire.</em>
                </h2>
              </div>
              <p>
                Les votes évoluent en temps réel.
                <br />
                Tout peut encore changer.
              </p>
            </div>
            <div className="podium">
              <div className="podium-person second">
                <Link
                  href={`/evenement/miss-lekie-2e-edition/candidate/${top3[1].slug}`}
                  className="podium-img"
                  style={{ display: 'block', cursor: 'pointer' }}
                  title={`Voir ${top3[1].name}`}
                >
                  <Photo id={top3[1].img} alt={top3[1].name} />
                </Link>
                <div className="podium-name">
                  {top3[1].n} <span>· {top3[1].name.toUpperCase()}</span>
                </div>
                <div className="podium-votes">
                  {top3[1].votes.toLocaleString('fr-FR')} <small>voix</small>
                </div>
                <div className="step">02</div>
              </div>

              <div className="podium-person first">
                <div className="crown">✳</div>
                <Link
                  href={`/evenement/miss-lekie-2e-edition/candidate/${top3[0].slug}`}
                  className="podium-img"
                  style={{ display: 'block', cursor: 'pointer' }}
                  title={`Voir ${top3[0].name}`}
                >
                  <Photo id={top3[0].img} alt={top3[0].name} />
                </Link>
                <div className="podium-name">
                  {top3[0].n} <span>· {top3[0].name.toUpperCase()}</span>
                </div>
                <div className="podium-votes">
                  {top3[0].votes.toLocaleString('fr-FR')} <small>voix</small>
                </div>
                <div className="step">01</div>
              </div>

              <div className="podium-person third">
                <Link
                  href={`/evenement/miss-lekie-2e-edition/candidate/${top3[2].slug}`}
                  className="podium-img"
                  style={{ display: 'block', cursor: 'pointer' }}
                  title={`Voir ${top3[2].name}`}
                >
                  <Photo id={top3[2].img} alt={top3[2].name} />
                </Link>
                <div className="podium-name">
                  {top3[2].n} <span>· {top3[2].name.toUpperCase()}</span>
                </div>
                <div className="podium-votes">
                  {top3[2].votes.toLocaleString('fr-FR')} <small>voix</small>
                </div>
                <div className="step">03</div>
              </div>
            </div>
            <p className="podium-foot">
              <span className="live-dot" /> PROVISOIRE · LES VOTES SONT OUVERTS JUSQU’AU 12 DÉCEMBRE
            </p>
          </div>
        </section>
      )}

      {/* HOW IT WORKS SECTION */}
      <section className="how-section" id="how">
        <div className="section how-grid">
          <div>
            <div className="section-kicker">04 / À VOUS DE JOUER</div>
            <h2>
              Un vote.
              <br />
              <em>Un vrai soutien.</em>
            </h2>
            <p className="how-intro">
              Faites entendre votre voix en quelques secondes. Simple, rapide et sécurisé via Mobile Money.
            </p>
            <a href="#candidates" className="button button-gold">
              Je vote maintenant <span>↗</span>
            </a>
          </div>
          <div className="steps">
            <div className="step-item">
              <span className="step-no">01</span>
              <div>
                <h3>Choisissez votre candidate</h3>
                <p>Découvrez leur parcours et choisissez celle qui vous inspire.</p>
              </div>
              <span className="step-icon">♧</span>
            </div>
            <div className="step-item">
              <span className="step-no">02</span>
              <div>
                <h3>Choisissez vos votes</h3>
                <p>
                  Un vote vaut <b>{settings.votePriceFcfa || 100} FCFA</b>. Vous pouvez en offrir autant que vous voulez.
                </p>
              </div>
              <span className="step-icon">＋</span>
            </div>
            <div className="step-item">
              <span className="step-no">03</span>
              <div>
                <h3>Validez sur votre téléphone</h3>
                <p>Payez avec MTN MoMo ou Orange Money. C’est tout !</p>
              </div>
              <span className="step-icon">✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE SECTION */}
      <section className="quote-section">
        <div className="quote-mark">“</div>
        <blockquote>
          La beauté n’est pas seulement ce que l’on voit.
          <br />
          C’est ce que l’on <em>transmet.</em>
        </blockquote>
        <span>MISS BEAUTÉ AFRICAINE LÉKIÉ · DEPUIS 2024</span>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="final-cta">
        <div className="section-kicker">LA COURONNE SE JOUE MAINTENANT</div>
        <h2>
          Votre voix peut
          <br />
          <em>tout changer.</em>
        </h2>
        <a href="#candidates" className="button button-gold">
          Choisir ma candidate <span>↗</span>
        </a>
        <div className="cta-ornament">✳</div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <a className="brand" href="#top">
            <img className="brand-logo" src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
            <span>
              NEEOVO<span className="gold">PASS</span>
            </span>
          </a>
          <p>
            Publie. Vends. Fais Voter.
            <br />
            La billetterie et plateforme de vote officielle de Miss Beauté Africaine Lékié.
          </p>
          <div className="footer-links">
            <a href="#edition">L’édition</a>
            <a href="#candidates">Candidates</a>
            <a href="#how">Comment voter</a>
          </div>
          <div className="social">
            SUIVEZ L’AVENTURE
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {settings.socials && settings.socials.length > 0 ? (
                settings.socials.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={soc.name}
                    aria-label={soc.name}
                    className="social-icon-btn"
                  >
                    <SocialIcon name={soc.name} size={19} color="#d9b66b" />
                  </a>
                ))
              ) : (
                <span style={{ color: '#777', fontSize: 10 }}>Aucun réseau configuré</span>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 NEEOVOPASS · TOUS DROITS RÉSERVÉS</span>
          <div>
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
            <a href="#">Contact</a>
          </div>
          <span>
            FAIT AVEC FIERTÉ AU CAMEROUN <b>✳</b>
          </span>
        </div>
      </footer>

      <a href="#candidates" className="mobile-vote">
        Voter maintenant <span>↗</span>
      </a>
    </main>
  );
}
