'use client';

import { useState } from 'react';

interface ManagerAuthProps {
  onAuth: (token: string) => void;
}

export default function ManagerAuth({ onAuth }: ManagerAuthProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Save token to sessionStorage
        sessionStorage.setItem('managerToken', data.token);
        onAuth(data.token);
      } else {
        setError(data.message || 'Senha incorreta');
      }
    } catch (err) {
      setError('Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in-up">
          <h1 className="text-5xl font-display font-bold text-shimmer mb-2">
            Coordenador
          </h1>
          <p className="text-xl text-ivory font-sans">
            Área Restrita
          </p>
        </div>

        <div className="card-elevated-lg bg-cocoa-light/90 rounded-2xl p-8 fade-in-up stagger-1 sheen">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-lg font-display font-semibold text-ivory mb-2"
              >
                Senha de Acesso
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full px-4 py-3 rounded-lg border-2 border-gold bg-cocoa text-ivory text-lg font-sans focus:outline-none focus:border-gold-light focus:ring-2 focus:ring-gold/20 transition-all placeholder-ivory/40"
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-crimson-light">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full btn btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ivory/80 font-semibold">
            <p>🔒 Apenas para coordenadores autorizados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
