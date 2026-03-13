'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Music2, Users, CheckCircle, Settings, FileText,
  ChevronRight, LogOut, BarChart3, Globe, Mic2, BookUser,
  PenTool, Library, DollarSign, Video
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

/* ── Icon nav button (left slim bar) ── */
function IconNav({ icon: Icon, href, active, label }: { icon: any; href: string; active: boolean; label: string }) {
  return (
    <Link href={href} title={label} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 40, height: 40, borderRadius: 8, cursor: 'pointer', transition: 'all .12s',
      background: active ? 'var(--surface-2)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-3)',
      textDecoration: 'none', flexShrink: 0,
    }}>
      <Icon style={{ width: 18, height: 18 }} />
    </Link>
  );
}

/* ── Sidebar text nav link ── */
function SideLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`nav-link ${active ? 'active' : ''}`}>
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const iconSections = [
    { icon: Home, href: '/admin', label: 'Overview' },
    { icon: Music2, href: '/admin/releases', label: 'Releases' },
    { icon: Users, href: '/admin/users', label: 'Users' },
    { icon: CheckCircle, href: '/admin/approvals', label: 'QC Approvals' },
    { icon: BarChart3, href: '/admin/analytics', label: 'Analytics' },
    { icon: DollarSign, href: '/admin/payouts', label: 'Payouts' },
    { icon: Settings, href: '/admin/settings', label: 'Settings' },
  ];

  /* Determine active section for second-level nav */
  const activeSection = (() => {
    if (pathname.startsWith('/admin/releases')) return 'assets';
    if (pathname.startsWith('/admin/users')) return 'contributors';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return null;
  })();

  const currentIcon = iconSections.find(i => {
    if (i.href === '/admin') return pathname === '/admin';
    return pathname.startsWith(i.href);
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Far-left icon bar ── */}
      <div style={{
        width: 56, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 12, paddingBottom: 12, gap: 4, background: 'var(--bg)',
      }}>
        {/* Logo mark */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <Music2 style={{ width: 14, height: 14, color: '#000' }} />
        </div>

        {iconSections.map(({ icon, href, label }) => (
          <IconNav key={href} icon={icon} href={href} label={label}
                   active={href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)} />
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
        }} title={user?.email} onClick={logout}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>

      {/* ── Second-level sidebar (context nav) ── */}
      {pathname.startsWith('/admin/releases') || pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/users') ? (
        <div style={{
          width: 164, flexShrink: 0, borderRight: '1px solid var(--border)',
          padding: '16px 8px', overflowY: 'auto', background: 'var(--bg)',
        }}>
          {/* Assets section */}
          {(pathname.startsWith('/admin/releases') || pathname === '/admin') && (
            <>
              <p className="nav-sec">ASSETS</p>
              <SideLink href="/admin/releases" label="Releases" active={pathname.startsWith('/admin/releases')} />
              <SideLink href="/admin/tracks" label="Tracks" active={pathname === '/admin/tracks'} />
              <SideLink href="/admin/videos" label="Videos" active={pathname === '/admin/videos'} />
              <p className="nav-sec">CONTRIBUTORS</p>
              <SideLink href="/admin/artists" label="Artists" active={pathname === '/admin/artists'} />
              <SideLink href="/admin/performers" label="Performers" active={pathname === '/admin/performers'} />
              <SideLink href="/admin/producers" label="Producers & Engineers" active={pathname === '/admin/producers'} />
              <SideLink href="/admin/writers" label="Writers" active={pathname === '/admin/writers'} />
              <SideLink href="/admin/publishers" label="Publishers" active={pathname === '/admin/publishers'} />
              <SideLink href="/admin/labels" label="Labels" active={pathname === '/admin/labels'} />
            </>
          )}
          {pathname.startsWith('/admin/users') && (
            <>
              <p className="nav-sec">USERS</p>
              <SideLink href="/admin/users" label="All Users" active={pathname === '/admin/users'} />
              <SideLink href="/admin/users/artists" label="Artists" active={pathname === '/admin/users/artists'} />
              <SideLink href="/admin/users/labels" label="Labels" active={pathname === '/admin/users/labels'} />
              <SideLink href="/admin/users/admins" label="Admins" active={pathname === '/admin/users/admins'} />
            </>
          )}
          {pathname.startsWith('/admin/settings') && (
            <>
              <p className="nav-sec">SETTINGS</p>
              <SideLink href="/admin/settings" label="Workspace" active={pathname === '/admin/settings'} />
              <SideLink href="/admin/settings" label="Branding" active={false} />
            </>
          )}
        </div>
      ) : null}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px 32px' }}>
        {children}
      </div>
    </div>
  );
}
