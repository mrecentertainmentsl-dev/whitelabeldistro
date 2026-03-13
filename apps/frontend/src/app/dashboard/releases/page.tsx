'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Music2, Plus, Search, MoreHorizontal, Loader2, Send, Trash2, Eye, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const STATUS: Record<string, { label: string; cls: string }> = {
  draft:       { label: 'Draft',        cls: 'bdg bdg-gray'   },
  pending:     { label: 'In Review',    cls: 'bdg bdg-yellow' },
  processing:  { label: 'Processing',   cls: 'bdg bdg-blue'   },
  approved:    { label: 'Approved',     cls: 'bdg bdg-green'  },
  rejected:    { label: 'Rejected',     cls: 'bdg bdg-red'    },
  distributed: { label: 'Distributed',  cls: 'bdg bdg-green'  },
};

function fmtDur(s?: number) {
  if (!s) return '—';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function DashboardReleasesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-releases', page, search],
    queryFn: () => api.get(`/api/v1/releases?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
    keepPreviousData: true,
  });

  const releases: any[] = data?.data || [];
  const total: number = data?.total || 0;

  const submitRelease = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/releases/${id}/submit`),
    onSuccess: () => { toast.success('Submitted for review'); qc.invalidateQueries({ queryKey: ['my-releases'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Submit failed'),
  });

  const deleteRelease = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/releases/${id}`),
    onSuccess: () => { toast.success('Release deleted'); qc.invalidateQueries({ queryKey: ['my-releases'] }); },
  });

  const totalDur = (songs: any[]) => songs?.reduce((a, s) => a + (s.durationSeconds || 0), 0) || 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Releases</h1>
        <Link href="/dashboard/upload" className="btn-p" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: 'var(--primary)', color: '#000', border: 'none' }}>
          <Plus style={{ width: 14, height: 14 }} /> Create new
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)' }} />
        <input className="inp" style={{ paddingLeft: 32 }} placeholder="Search releases…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Title</th>
              <th>Release ID</th>
              <th>Artist</th>
              <th>Label</th>
              <th>UPC</th>
              <th>Date</th>
              <th>Tracks</th>
              <th>Duration</th>
              <th>Status</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 36 }}>
                <Loader2 style={{ width: 18, height: 18, color: 'var(--text-3)' }} className="animate-spin" />
              </td></tr>
            ) : releases.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music2 style={{ width: 20, height: 20, color: 'var(--text-4)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>No releases yet</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Create your first release to get started</p>
                  </div>
                  <Link href="/dashboard/upload" className="btn-p btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, background: 'var(--primary)', color: '#000', border: 'none', marginTop: 4 }}>
                    <Plus style={{ width: 12, height: 12 }} /> Create Release
                  </Link>
                </div>
              </td></tr>
            ) : releases.map(r => {
              const st = STATUS[r.status] || STATUS.draft;
              const dur = totalDur(r.songs);
              return (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.artworkUrl
                        ? <img src={r.artworkUrl} alt={r.title} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Music2 style={{ width: 14, height: 14, color: 'var(--text-4)' }} />
                          </div>}
                      <Link href={`/dashboard/releases/${r.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                        {r.title}
                      </Link>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{r.releaseId || r.id?.slice(0, 7).toUpperCase()}</td>
                  <td style={{ fontSize: 12 }}>{r.songs?.[0]?.artistName || '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.labelName || 'MREC Entertainment'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>{r.upc || '—'}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                  <td style={{ fontSize: 13, textAlign: 'center' }}>{r.songs?.length || 0}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtDur(dur)}</td>
                  <td><span className={st.cls}>{st.label}</span></td>
                  <td style={{ position: 'relative' }}>
                    <button onClick={() => setMenu(menu === r.id ? null : r.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '3px 5px', borderRadius: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <MoreHorizontal style={{ width: 15, height: 15 }} />
                    </button>
                    {menu === r.id && (
                      <div className="context-menu" style={{ right: 0, top: '100%' }} onMouseLeave={() => setMenu(null)}>
                        <Link href={`/dashboard/releases/${r.id}`} className="context-item" style={{ textDecoration: 'none' }} onClick={() => setMenu(null)}>
                          <Eye style={{ width: 13, height: 13 }} /> View
                        </Link>
                        {r.status === 'draft' && (
                          <div className="context-item" onClick={() => { submitRelease.mutate(r.id); setMenu(null); }}>
                            <Send style={{ width: 13, height: 13 }} /> Submit for Review
                          </div>
                        )}
                        {(r.status === 'approved' || r.status === 'distributed') && (
                          <a href={`/api/v1/ddex/${r.id}/xml?download=1`} className="context-item" style={{ textDecoration: 'none' }}>
                            <Download style={{ width: 13, height: 13 }} /> Export DDEX XML
                          </a>
                        )}
                        {r.status === 'draft' && (
                          <div className="context-item danger" onClick={() => { if (confirm('Delete this release?')) { deleteRelease.mutate(r.id); } setMenu(null); }}>
                            <Trash2 style={{ width: 13, height: 13 }} /> Delete
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {total > 20 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-s btn-sm">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="btn-s btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
