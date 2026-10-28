
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ClipboardList, ShieldCheck } from 'lucide-react';
import { startCognitoAuth } from '@/lib/cognito';

export default function RegisterPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const pool = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const client = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

  async function createAccount() {
    setMessage('');
    setLoading(true);

    try {
      await startCognitoAuth('signup');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to open account registration.');
      setLoading(false);
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
        <span className="eyebrow">CREATE YOUR WORKSPACE</span>
        <h1>Start tracking securely.</h1>
        <p>
          Create an account with Amazon Cognito. Your password is handled by
          AWS, not stored by ApplyTrack.
        </p>

        {pool && client && domain ? (
          <button
            type="button"
            className="button button-primary auth-wide"
            onClick={createAccount}
            disabled={loading}
          >
            {loading ? 'Opening registration…' : 'Create account'}
          </button>
        ) : (
          <div className="alert">
            Cognito environment variables are missing. Configure the frontend environment first.
          </div>
        )}

        {message && <p className="auth-message">{message}</p>}

        <Link className="auth-back" href="/login">
          <ArrowLeft size={14} /> Already have an account? Sign in
        </Link>
      </section>
    </main>
  );
}
