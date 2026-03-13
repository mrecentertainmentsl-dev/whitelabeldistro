'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Music2 } from 'lucide-react';
import { api } from '@/lib/api';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/api/v1/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      toast.success('Account created! Please verify your email.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 style={{ width: 16, height: 16, color: '#000' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>MREC Entertainment</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Create account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Start distributing your music globally</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>First Name</label>
                <input {...register('firstName')} className="inp" placeholder="John" autoFocus />
                {errors.firstName && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.firstName.message}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Last Name</label>
                <input {...register('lastName')} className="inp" placeholder="Doe" />
                {errors.lastName && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.lastName.message}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email</label>
              <input {...register('email')} className="inp" type="email" placeholder="you@email.com" autoComplete="email" />
              {errors.email && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} className="inp" type={showPw ? 'text' : 'password'}
                       placeholder="8+ characters" style={{ paddingRight: 36 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Confirm Password</label>
              <input {...register('confirmPassword')} className="inp" type="password" placeholder="••••••••" autoComplete="new-password" />
              {errors.confirmPassword && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-p"
                    style={{ width: '100%', justifyContent: 'center', padding: '9px 0', marginTop: 4 }}>
              {isSubmitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
              Create Account
            </button>
          </form>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 16 }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
