'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Music2, Upload, Clock, CheckCircle, Globe, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';

const STATUS: Record<string, { label: string; cls: string }> = {
  draft:       { label: 'Draft',       cls: 'bdg bdg-gray'   },
  pending:     { label: 'In Review',   cls: 'bdg bdg-yellow' },
  processing:  { label: 'Processing',  cls: 'bdg bdg-blue'   },
  approved:    { label: 'Approved',    cls: 'bdg bdg-green'  },
  rejected:    { label: 'Rejected',    cls: 'bdg bdg-red'    },
  distributed: { label: 'Distributed', cls: 'bdg bdg-green'  },
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: releases } = useQuery({
    queryKey: ['my-releases-dash'],
    queryFn: () => api.get('/api/v1/releases?page=1&limit=5').then(r => r.data),
  });

  const items: any[] = releases?.data || [];
  const total: number = releases?.total || 0;

  const pending = items.filter(r => r.status === 'pending').length;
  const distributed = items.filter(r => r.status === 'distributed').length;
  const rejected = items.filter(r => r.status === 'rejected').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {greeting()}, {user?.firstName || 'Artist'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>
          {total > 0 ? `You have ${total} release${total !== 1 ? 's' : ''} on the platform.` : 'Upload your first release to get started.'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Releases', value: total, icon: Music2, color: 'var(--primary)' },
          { label: 'In Review',      value: pending, icon: Clock, color: 'var(--warning)' },
          { label: 'Distributed',    value: distributed, icon: Globe, color: 'var(--success)' },
          { label: 'Rejected',       value: rejected, icon: AlertCircle, color: 'var(--danger)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link href="/dashboard/upload" style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          background: 'var(--primary-dim)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8,
          textDecoration: 'none', transition: 'border-color .12s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)')}>
          <div style={{ width: 36, height: 36, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus style={{ width: 18, height: 18, color: '#000' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>New Release</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Upload tracks and distribute</p>
          </div>
        </Link>
        <Link href="/dashboard/releases" style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          textDecoration: 'none', transition: 'border-color .12s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          <div style={{ width: 36, height: 36, borderRadius: 7, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Music2 style={{ width: 18, height: 18, color: 'var(--text-2)' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>My Releases</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>View and manage all releases</p>
          </div>
        </Link>
      </div>

      {/* Recent releases */}
      {items.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Recent Releases</h2>
            <Link href="/dashboard/releases" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Type</th>
                  <th>Tracks</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => {
                  const st = STATUS[r.status] || STATUS.draft;
                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {r.artworkUrl
                            ? <img src={r.artworkUrl} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 30, height: 30, borderRadius: 4, background: 'var(--surface-3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music2 style={{ width: 13, height: 13, color: 'var(--text-4)' }} /></div>}
                          <Link href={`/dashboard/releases/${r.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                            {r.title}
                          </Link>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{r.songs?.[0]?.artistName || '—'}</td>
                      <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{r.type}</td>
                      <td style={{ fontSize: 12, textAlign: 'center' }}>{r.songs?.length || 0}</td>
                      <td style={{ fontSize: 12 }}>{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                      <td><span className={st.cls}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Music2 style={{ width: 22, height: 22, color: 'var(--text-4)' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No releases yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Upload your first release and distribute it globally
          </p>
          <Link href="/dashboard/upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--primary)', color: '#000', borderRadius: 6, textDecoration: 'none',
            fontSize: 13, fontWeight: 500,
          }}>
            <Plus style={{ width: 14, height: 14 }} /> Create Release
          </Link>
        </div>
      )}
    </div>
  );
}
