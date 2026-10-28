
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, ExternalLink, ShieldCheck } from 'lucide-react';
import { exchangeCognitoCode, startCognitoAuth } from '@/lib/cognito';

export default function LoginPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const pool = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const client = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error_description') || params.get('error');

    if (error) {
      setMessage(`Sign-in failed: ${error}`);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    if (code && state) {
      setLoading(true);
      exchangeCognitoCode(code, state)
        .then(() => {
          window.history.replaceState(null, '', window.location.pathname);
          window.location.assign('/dashboard');
        })
        .catch((err: unknown) => {
          setMessage(err instanceof Error ? err.message : 'Unable to complete sign-in.');
          window.history.replaceState(null, '', window.location.pathname);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  async function signIn() {
    setMessage('');
    try {
      await startCognitoAuth('login');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to open Cognito sign-in.');
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand">
        <span className="brand-mark"><ClipboardList size={21} /></span>
        ApplyTrack
      </Link>

      <section className="auth-card">
        <span className="auth-symbol"><ShieldCheck size={25} /></span>
        <span className="eyebrow">PRIVATE WORKSPACE</span>
        <h1>Sign in to ApplyTrack</h1>
        <p>Use your Amazon Cognito account to access applications saved to your private AWS workspace.</p>

        {pool && client && domain ? (
          <button
            type="button"
            className="button button-primary auth-wide"
            onClick={signIn}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Continue with Cognito'}
            <ExternalLink size={15} />
          </button>
        ) : (
          <div className="alert alert-error">
            Cognito environment variables are missing. Configure the frontend environment first.
          </div>
        )}

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-note">
          Your session token stays in this browser tab. Never share it with anyone.
        </p>

        <Link className="auth-back" href="/dashboard">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </section>
    </main>
  );
}
