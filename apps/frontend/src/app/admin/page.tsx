'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Music2, Users, Clock, CheckCircle, Globe, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  draft: { cls: 'bdg bdg-gray', label: 'Draft' },
  pending: { cls: 'bdg bdg-yellow', label: 'Pending' },
  processing: { cls: 'bdg bdg-blue', label: 'Processing' },
  approved: { cls: 'bdg bdg-green', label: 'Approved' },
  rejected: { cls: 'bdg bdg-red', label: 'Rejected' },
  distributed: { cls: 'bdg bdg-green', label: 'Distributed' },
};

export default function AdminPage() {
  const { data: overview, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/api/v1/admin/overview').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['admin-pending-preview'],
    queryFn: () => api.get('/api/v1/admin/releases?status=pending&limit=5').then(r => r.data),
  });

  const stats = [
    { label: 'Total Users', value: overview?.users?.total, icon: Users, color: 'var(--info)' },
    { label: 'Total Releases', value: overview?.releases?.total, icon: Music2, color: 'var(--primary)' },
    { label: 'Pending QC', value: overview?.releases?.pending, icon: Clock, color: 'var(--warning)' },
    { label: 'Distributed', value: overview?.releases?.distributed, icon: Globe, color: 'var(--success)' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Overview</h1>
        <button className="btn-s btn-sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw style={{ width: 13, height: 13 }} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 15, height: 15, color }} />
              </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Release status breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 3fr', gap: 16 }}>

        {/* Pending queue */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Pending QC Review</h2>
            <Link href="/admin/approvals" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {!pendingData?.data?.length ? (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                🎉 No releases pending review
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Release</th><th>Artist</th><th>Type</th><th>Submitted</th><th></th></tr></thead>
                <tbody>
                  {pendingData.data.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {r.artworkUrl
                            ? <img src={r.artworkUrl} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 30, height: 30, borderRadius: 4, background: 'var(--surface-3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Music2 style={{ width: 12, height: 12, color: 'var(--text-4)' }} />
                              </div>}
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.title}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{r.user?.email}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{r.type}</td>
                      <td style={{ fontSize: 12 }}>{r.submittedAt ? format(new Date(r.submittedAt), 'MMM d') : '—'}</td>
                      <td>
                        <Link href="/admin/approvals" className="btn-ok btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Release Status</h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['pending', 'approved', 'distributed', 'rejected'] as const).map((s, i, arr) => {
              const count = overview?.releases?.[s] || 0;
              const total = overview?.releases?.total || 1;
              const pct = Math.round((count / total) * 100);
              const cfg = STATUS_CFG[s];
              return (
                <div key={s} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className={cfg.cls}>{cfg.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: s === 'rejected' ? 'var(--danger)' : s === 'pending' ? 'var(--warning)' : 'var(--primary)', transition: 'width .4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <Link href="/admin/releases" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', fontSize: 13, color: 'var(--text-2)', transition: 'border-color .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <span>All Releases</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
            <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', fontSize: 13, color: 'var(--text-2)', transition: 'border-color .12s', marginTop: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <span>Manage Users</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
            <Link href="/admin/settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', fontSize: 13, color: 'var(--text-2)', transition: 'border-color .12s', marginTop: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <span>Platform Settings</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
