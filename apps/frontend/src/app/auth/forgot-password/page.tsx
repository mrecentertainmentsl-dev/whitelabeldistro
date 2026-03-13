'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Mail, Music2 } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({ email: z.string().email('Invalid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/api/v1/auth/forgot-password', data);
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 style={{ width: 16, height: 16, color: '#000' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>MREC Entertainment</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Mail style={{ width: 20, height: 20, color: 'var(--primary)' }} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Check your email</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                We sent a reset link to <strong style={{ color: 'var(--text-2)' }}>{getValues('email')}</strong>.
                Check your inbox and click the link to reset your password.
              </p>
              <Link href="/auth/login" className="btn-s" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 20, alignItems: 'center', gap: 6 }}>
                <ArrowLeft style={{ width: 13, height: 13 }} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Reset password</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Enter your email and we'll send you a reset link</p>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email address</label>
                  <input {...register('email')} className="inp" type="email" placeholder="you@email.com" autoFocus />
                  {errors.email && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-p" style={{ width: '100%', justifyContent: 'center', padding: '9px 0' }}>
                  {isSubmitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
                  Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/auth/login" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
            <ArrowLeft style={{ width: 12, height: 12 }} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
