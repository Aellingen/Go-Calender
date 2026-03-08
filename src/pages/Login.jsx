import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Checking session...</div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        // Create user row via API
        if (data.user) {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authUserId: data.user.id, name }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to create account');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%', maxWidth: 380, padding: '40px 36px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-2xl)', boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 52, height: 52, borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: 'var(--shadow-accent)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>

        <h1 className="font-display" style={{
          fontSize: 28, color: 'var(--text)', margin: '0 0 6px',
          letterSpacing: '-0.03em',
        }}>
          Go Calendar
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
        </p>

        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: 16,
            background: 'var(--error-bg, #fef2f2)', color: 'var(--error, #dc2626)',
            borderRadius: 'var(--r-lg)', fontSize: 13, fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '13px 28px', borderRadius: 'var(--r-full)',
              fontWeight: 700, fontSize: 14, color: '#fff',
              background: submitting ? 'var(--text-muted)' : 'var(--accent)',
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-accent)',
              transition: 'all 0.2s var(--ease-out)',
              fontFamily: "'Nunito', sans-serif",
              marginTop: 4,
            }}
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontWeight: 700, cursor: 'pointer', fontSize: 13,
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 'var(--r-lg)',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  fontSize: 14,
  color: 'var(--text)',
  outline: 'none',
  fontFamily: "'Nunito', sans-serif",
  width: '100%',
  boxSizing: 'border-box',
};
