'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Music2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password required'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      const res = await api.post('/api/v1/auth/login', data);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      if (res.data.user.role?.name === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 style={{ width: 16, height: 16, color: '#000' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>MREC Entertainment</span>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 28px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Welcome back to your distribution platform</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email</label>
              <input {...register('email')} className="inp" type="email" placeholder="you@email.com" autoComplete="email" autoFocus />
              {errors.email && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} className="inp" type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: 36 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-p" style={{ width: '100%', justifyContent: 'center', padding: '9px 0', marginTop: 4 }}>
              {isSubmitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
              Sign in
            </button>
          </form>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 16 }}>
          Don't have an account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Create account</Link>
        </p>
      </div>
    </div>
  );
}
