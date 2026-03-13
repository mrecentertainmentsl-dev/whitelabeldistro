'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Music2 } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  if (!token) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <p style={{ color: 'var(--text-3)', marginBottom: 16 }}>Invalid or expired reset link.</p>
        <Link href="/auth/forgot-password" className="btn-p" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '7px 14px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: 'var(--primary)', color: '#000' }}>
          Request New Link
        </Link>
      </div>
    </div>
  );

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/api/v1/auth/reset-password', { token, password: data.password });
      toast.success('Password reset! Please sign in.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
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
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Set new password</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Choose a strong password for your account</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} className="inp" type={showPw ? 'text' : 'password'}
                       placeholder="8+ characters" style={{ paddingRight: 36 }} autoFocus />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Confirm Password</label>
              <input {...register('confirmPassword')} className="inp" type="password" placeholder="••••••••" />
              {errors.confirmPassword && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-p"
                    style={{ width: '100%', justifyContent: 'center', padding: '9px 0', marginTop: 4 }}>
              {isSubmitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
