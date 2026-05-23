import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const { signIn, signUp, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    clearError();
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password);
        if (result?.user && !result.session) {
          setSuccessMsg('Controlla la tua email per confermare l\'account.');
          setMode('login');
        }
      }
    } catch {
      // Error is handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt="DaySync Logo"
            className="w-32 h-32 mx-auto mb-4"
          />
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Accedi al tuo account' : 'Crea un nuovo account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="nome@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Password</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3"
            >
              {error}
            </motion.p>
          )}

          {successMsg && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-primary bg-primary/10 rounded-xl px-4 py-3"
            >
              {successMsg}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {submitting
              ? (mode === 'login' ? 'Accesso in corso...' : 'Registrazione...')
              : (mode === 'login' ? 'Accedi' : 'Registrati')
            }
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary font-semibold"
          >
            {mode === 'login' ? 'Registrati' : 'Accedi'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
