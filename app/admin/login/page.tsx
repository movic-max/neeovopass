'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAdmin, isAdminAuthenticated } from '@/lib/store';
import '../admin.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const ok = loginAdmin(loginId, password);
      if (ok) {
        router.push('/admin');
      } else {
        setError('Identifiant ou mot de passe incorrect. Vérifiez vos accès.');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <main className="admin-login-page">
      <div className="login-backdrop-glow" />

      <div className="admin-login-card">
        <div className="login-header">
          <Link href="/" className="login-brand">
            <img className="login-brand-logo" src="/neeovopass-logo.jpg" alt="NEEOVOPASS" />
            <div className="login-brand-text">
              NEEOVO<span>PASS</span>
            </div>
          </Link>
          <div className="login-badge">CONTRÔLE ADMINISTRATEUR</div>
          <h1>Espace Gestion</h1>
          <p>Accès restreint au comité d’organisation Miss Lékié</p>
        </div>

        {error && (
          <div className="login-error" role="alert" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-id">
              IDENTIFIANT
              <small>ID attribué</small>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                id="admin-id"
                type="text"
                autoComplete="username"
                className="admin-input"
                placeholder="Identifiant"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              MOT DE PASSE
              <small>Code secret</small>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="admin-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter au Dashboard ↗'}
          </button>
        </form>

        <div className="login-footer-links">
          <Link href="/" className="login-back-link">
            ← Retour au site public NEEOVOPASS
          </Link>
        </div>
      </div>
    </main>
  );
}
