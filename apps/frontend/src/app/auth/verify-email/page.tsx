'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Music2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const params = useSearchParams();
  const token = params.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    api.post(`/api/v1/auth/verify-email/${token}`)
      .then(res => { setStatus('success'); setMessage(res.data.message || 'Your email has been verified.'); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.'); });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 style={{ width: 16, height: 16, color: '#000' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>MREC Entertainment</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px 28px', textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <Loader2 style={{ width: 36, height: 36, color: 'var(--text-3)', margin: '0 auto 16px' }} className="animate-spin" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Verifying your email…</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle style={{ width: 24, height: 24, color: 'var(--primary)' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Email verified!</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
              <Link href="/auth/login" className="btn-p" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: 'var(--primary)', color: '#000' }}>
                Sign In Now
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <XCircle style={{ width: 24, height: 24, color: 'var(--danger)' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Verification failed</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
              <Link href="/auth/register" className="btn-s" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                Register Again
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
