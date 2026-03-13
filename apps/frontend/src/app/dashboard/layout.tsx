'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Music2, Upload, BarChart3, Settings, Bell, LogOut, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useBrandingContext } from '@/lib/branding-context';

const NAV = [
  { icon: Home,     href: '/dashboard',          label: 'Dashboard' },
  { icon: Music2,   href: '/dashboard/releases',  label: 'My Releases' },
  { icon: Upload,   href: '/dashboard/upload',    label: 'Upload' },
  { icon: BarChart3,href: '/dashboard/analytics', label: 'Analytics' },
  { icon: Settings, href: '/dashboard/settings',  label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '16px 10px',
        background: 'var(--bg)', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', marginBottom: 20 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Music2 style={{ width: 14, height: 14, color: '#000' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>MREC</span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV.map(({ icon: Icon, href, label }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-link ${active ? 'active' : ''}`}>
                <Icon className="nav-icon" style={{ width: 16, height: 16, flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: user?.avatarUrl ? undefined : 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || `${user?.firstName} ${user?.lastName}`}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', cursor: 'pointer', marginTop: 2 }}>
            <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 32px' }}>
        {children}
      </div>
    </div>
  );
}
