'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search, Filter, LayoutList, Grid2X2, Table2,
  SortAsc, Music2, Plus, MoreHorizontal, ChevronUp, ChevronDown, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

type SortKey = 'title' | 'releaseId' | 'artistName' | 'labelName' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bdg bdg-gray' },
  pending: { label: 'Pending', cls: 'bdg bdg-yellow' },
  processing: { label: 'Processing', cls: 'bdg bdg-blue' },
  approved: { label: 'Approved', cls: 'bdg bdg-green' },
  rejected: { label: 'Rejected', cls: 'bdg bdg-red' },
  distributed: { label: 'Distributed', cls: 'bdg bdg-green' },
};

function fmtDuration(secs?: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function SortTh({ col, label, sort, setSort }: { col: SortKey; label: string; sort: [SortKey, SortDir]; setSort: (s: [SortKey, SortDir]) => void }) {
  const active = sort[0] === col;
  return (
    <th onClick={() => setSort([col, active && sort[1] === 'asc' ? 'desc' : 'asc'])}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? sort[1] === 'asc' ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />
          : <div style={{ width: 12, height: 12 }} />}
      </div>
    </th>
  );
}

export default function AdminReleasesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<[SortKey, SortDir]>(['createdAt', 'desc']);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin-releases-all', status, page, search],
    queryFn: () => api.get(`/api/v1/admin/releases?page=${page}&limit=25${status !== 'all' ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
    keepPreviousData: true,
  });

  const releases: any[] = data?.data || [];
  const total: number = data?.total || 0;

  // Client-side sort (supplement server sort)
  const sorted = [...releases].sort((a, b) => {
    let av = '', bv = '';
    if (sort[0] === 'createdAt') { av = a.createdAt; bv = b.createdAt; }
    else if (sort[0] === 'title') { av = a.title; bv = b.title; }
    else if (sort[0] === 'artistName') { av = a.user?.email || ''; bv = b.user?.email || ''; }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort[1] === 'asc' ? cmp : -cmp;
  });

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const allSelected = sorted.length > 0 && sorted.every(r => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(sorted.map(r => r.id)));

  const totalDuration = (songs: any[]) => songs?.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) || 0;

  const STATUSES = ['all', 'pending', 'draft', 'approved', 'rejected', 'distributed'];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Releases</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-s btn-sm"><Filter style={{ width: 13, height: 13 }} />Filter</button>
          <Link href="/admin/approvals" className="btn-p btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: 'var(--primary)', color: '#000', border: 'none' }}>
            <Plus style={{ width: 13, height: 13 }} />Create new
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)' }} />
          <input className="inp" style={{ paddingLeft: 32, fontSize: 13 }} placeholder="Search"
                 value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
          {[['list', LayoutList], ['grid', Grid2X2]].map(([v, Icon]: any) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 10px', border: 'none', cursor: 'pointer', transition: 'all .12s',
              background: view === v ? 'var(--surface-3)' : 'transparent',
              color: view === v ? 'var(--text)' : 'var(--text-3)',
            }}>
              <Icon style={{ width: 15, height: 15 }} />
            </button>
          ))}
          <button style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-3)' }}>
            <Table2 style={{ width: 15, height: 15 }} />
          </button>
          <button style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-3)' }}>
            <Filter style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 32, padding: '8px 12px' }}>
                <div onClick={toggleAll} className={`checkbox ${allSelected ? 'checked' : ''}`} style={{ margin: 'auto' }}>
                  {allSelected && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3 5.5L7 1.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
              </th>
              <SortTh col="title" label="Title" sort={sort} setSort={s => { setSort(s); setPage(1); }} />
              <th>Release ID</th>
              <SortTh col="artistName" label="Artist Name" sort={sort} setSort={s => { setSort(s); setPage(1); }} />
              <th>Label Name</th>
              <th>UPC</th>
              <SortTh col="createdAt" label="Creation Date" sort={sort} setSort={s => { setSort(s); setPage(1); }} />
              <th>Tracks</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>
                <Loader2 style={{ width: 18, height: 18, color: 'var(--text-3)' }} className="animate-spin" />
              </td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 13 }}>
                No releases found
              </td></tr>
            ) : sorted.map(r => {
              const dur = totalDuration(r.songs);
              return (
                <tr key={r.id} onClick={() => toggleSelect(r.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '9px 12px' }} onClick={e => e.stopPropagation()}>
                    <div onClick={() => toggleSelect(r.id)} className={`checkbox ${selected.has(r.id) ? 'checked' : ''}`} style={{ margin: 'auto' }}>
                      {selected.has(r.id) && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3 5.5L7 1.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.artworkUrl
                        ? <img src={r.artworkUrl} alt={r.title} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Music2 style={{ width: 14, height: 14, color: 'var(--text-4)' }} />
                          </div>}
                      <Link href={`/admin/releases/${r.id}`}
                            style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}
                            onClick={e => e.stopPropagation()}>
                        {r.title}
                      </Link>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{r.releaseId || r.id?.slice(0, 7).toUpperCase()}</td>
                  <td style={{ fontSize: 13 }}>
                    {r.songs?.[0]?.artistName || r.user?.firstName || '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{r.labelName || r.user?.labelName || 'MREC Entertainment'}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{r.upc || '—'}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                  <td style={{ textAlign: 'center', fontSize: 13 }}>{r.songs?.length || 0}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{fmtDuration(dur)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination footer */}
        {total > 25 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-s btn-sm">Prev</button>
              <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="btn-s btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 8,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 20,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{selected.size} selected</span>
          <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
          <button className="btn-s btn-sm">Export DDEX</button>
          <button className="btn-ok btn-sm">Approve All</button>
          <button className="btn-danger btn-sm">Reject All</button>
          <button className="btn-g btn-sm" onClick={() => setSelected(new Set())}>Cancel</button>
        </div>
      )}
    </div>
  );
}
