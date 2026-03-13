'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, Music2, Play, Download,
  ChevronRight, Loader2, AlertTriangle, Info, User,
  FileText, Volume2, ImageIcon, Tag, Globe, Calendar,
  ChevronDown, ChevronUp, Search, Filter, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

/* ── QC Check item ── */
interface QCCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  detail?: string;
}

function runQcChecks(release: any): QCCheck[] {
  const checks: QCCheck[] = [];
  const songs = release?.songs || [];

  checks.push({
    id: 'artwork', label: 'Cover artwork uploaded',
    status: release?.artworkUrl ? 'pass' : 'fail',
    detail: release?.artworkUrl ? 'Artwork present' : 'No artwork uploaded',
  });
  checks.push({
    id: 'tracks', label: 'At least one track',
    status: songs.length > 0 ? 'pass' : 'fail',
    detail: `${songs.length} track(s)`,
  });
  checks.push({
    id: 'audio', label: 'All tracks have audio',
    status: songs.every((s: any) => s.audioUrl || s.audioS3Key) ? 'pass' : songs.some((s: any) => s.audioUrl || s.audioS3Key) ? 'warn' : 'fail',
    detail: songs.filter((s: any) => s.audioUrl || s.audioS3Key).length + '/' + songs.length + ' tracks have audio files',
  });
  checks.push({
    id: 'isrc', label: 'ISRC codes present',
    status: songs.length === 0 ? 'pending' : songs.every((s: any) => s.isrc) ? 'pass' : songs.some((s: any) => s.isrc) ? 'warn' : 'fail',
    detail: songs.filter((s: any) => s.isrc).length + '/' + songs.length + ' tracks have ISRC',
  });
  checks.push({
    id: 'upc', label: 'UPC / EAN present',
    status: release?.upc ? 'pass' : 'warn',
    detail: release?.upc || 'No UPC — will be auto-generated',
  });
  checks.push({
    id: 'genre', label: 'Genre selected',
    status: release?.genre ? 'pass' : 'warn',
    detail: release?.genre || 'No genre set',
  });
  checks.push({
    id: 'release_date', label: 'Release date set',
    status: release?.releaseDate ? 'pass' : 'warn',
    detail: release?.releaseDate ? format(new Date(release.releaseDate), 'MMM d, yyyy') : 'No release date',
  });
  checks.push({
    id: 'explicit', label: 'Explicit content flagged',
    status: 'pass',
    detail: songs.some((s: any) => s.isExplicit) ? 'Explicit content present and flagged' : 'No explicit content',
  });
  checks.push({
    id: 'ddex', label: 'DDEX ERN 4.3 compatible',
    status: songs.length > 0 && release?.artworkUrl ? 'pass' : 'warn',
    detail: 'Required fields: title, artist, artwork, audio',
  });
  checks.push({
    id: 'platforms', label: 'Distribution platforms selected',
    status: release?.distributionPlatforms?.length > 0 ? 'pass' : 'warn',
    detail: `${release?.distributionPlatforms?.length || 0} platform(s) selected`,
  });

  return checks;
}

const QC_ICON: Record<string, any> = {
  pass: CheckCircle, fail: XCircle, warn: AlertTriangle, pending: Clock,
};
const QC_COLOR: Record<string, string> = {
  pass: 'var(--success)', fail: 'var(--danger)', warn: 'var(--warning)', pending: 'var(--text-3)',
};

/* ── Release QC Panel ── */
function ReleaseQCPanel({ release, onClose }: { release: any; onClose: () => void }) {
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const qc = useQueryClient();

  const checks = runQcChecks(release);
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warned = checks.filter(c => c.status === 'warn').length;

  const approve = useMutation({
    mutationFn: () => api.post(`/api/v1/releases/${release.id}/approve`, { notes: approveNotes }),
    onSuccess: () => { toast.success('Release approved'); qc.invalidateQueries({ queryKey: ['qc-pending'] }); qc.invalidateQueries({ queryKey: ['admin-overview'] }); onClose(); },
    onError: () => toast.error('Approval failed'),
  });
  const reject = useMutation({
    mutationFn: () => api.post(`/api/v1/releases/${release.id}/reject`, { reason: rejectReason }),
    onSuccess: () => { toast.success('Release rejected'); qc.invalidateQueries({ queryKey: ['qc-pending'] }); onClose(); },
    onError: () => toast.error('Rejection failed'),
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12,
        width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto',
      }} className="fade-in">

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {release.artworkUrl
              ? <img src={release.artworkUrl} alt={release.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
              : <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music2 style={{ width: 18, height: 18, color: 'var(--text-4)' }} /></div>}
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{release.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{release.user?.email} · {release.type} · {release.songs?.length || 0} tracks</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>×</button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: track list + metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Metadata */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Release Info</div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Type', release.type],
                  ['Genre', release.genre || '—'],
                  ['Language', release.language || '—'],
                  ['Label', release.labelName || '—'],
                  ['UPC', release.upc || 'Not set'],
                  ['Release Date', release.releaseDate ? format(new Date(release.releaseDate), 'MMM d, yyyy') : '—'],
                  ['Submitted', release.submittedAt ? format(new Date(release.submittedAt), 'MMM d, yyyy HH:mm') : '—'],
                  ['Platforms', release.distributionPlatforms?.join(', ') || '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'right', wordBreak: 'break-all', textTransform: 'capitalize' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracks */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Tracks ({release.songs?.length || 0})
              </div>
              {(release.songs || []).map((s: any, i: number) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-4)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {s.artistName}{s.isExplicit ? ' · 🅴' : ''}
                      {s.isrc ? ` · ${s.isrc}` : ' · no ISRC'}
                    </p>
                  </div>
                  {s.audioUrl
                    ? <a href={s.audioUrl} target="_blank" rel="noopener noreferrer"><Play style={{ width: 14, height: 14, color: 'var(--primary)' }} /></a>
                    : <AlertTriangle style={{ width: 14, height: 14, color: 'var(--warning)' }} />}
                </div>
              ))}
            </div>

            {/* Submission notes */}
            {release.submissionNotes && (
              <div style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Artist Notes</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{release.submissionNotes}</p>
              </div>
            )}
          </div>

          {/* Right: QC checklist + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* QC Score */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>QC Checklist</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="bdg bdg-green">{passed} pass</span>
                  {warned > 0 && <span className="bdg bdg-yellow">{warned} warn</span>}
                  {failed > 0 && <span className="bdg bdg-red">{failed} fail</span>}
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {checks.map(c => {
                  const Icon = QC_ICON[c.status];
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 14px' }}>
                      <Icon style={{ width: 14, height: 14, color: QC_COLOR[c.status], flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{c.label}</p>
                        {c.detail && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{c.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DDEX compatibility */}
            <div style={{ padding: '10px 14px', background: 'var(--primary-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>DDEX ERN 4.3</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                {failed === 0 ? 'Release meets DDEX ERN 4.3 requirements and is ready for XML package generation.' : `${failed} required field(s) missing. Fix before approving.`}
              </p>
            </div>

            {/* Admin notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Admin Notes (optional, sent to artist on approval)</label>
              <textarea className="inp" rows={3} value={approveNotes}
                        onChange={e => setApproveNotes(e.target.value)}
                        placeholder="Any notes for the artist..." />
            </div>

            {/* Approve */}
            <button className="btn-ok" onClick={() => approve.mutate()} disabled={approve.isPending} style={{ justifyContent: 'center', padding: '9px 0' }}>
              {approve.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <CheckCircle style={{ width: 14, height: 14 }} />}
              Approve & Queue Distribution
            </button>

            {/* Reject section */}
            <div>
              <button className="btn-danger" onClick={() => setShowReject(!showReject)} style={{ width: '100%', justifyContent: 'center', padding: '9px 0' }}>
                <XCircle style={{ width: 14, height: 14 }} />
                Reject Release
                {showReject ? <ChevronUp style={{ width: 14, height: 14, marginLeft: 'auto' }} /> : <ChevronDown style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
              </button>

              {showReject && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea className="inp" rows={4} value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Describe what needs to be fixed so the artist can resubmit..." />
                  <button className="btn-danger" onClick={() => { if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; } reject.mutate(); }}
                          disabled={reject.isPending} style={{ justifyContent: 'center' }}>
                    {reject.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ApprovalsPage() {
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['qc-pending'],
    queryFn: () => api.get('/api/v1/admin/releases?status=pending&limit=100').then(r => r.data),
    refetchInterval: 60_000,
  });

  const releases = (data?.data || []).filter((r: any) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>QC Review Queue</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            {releases.length} release{releases.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <button className="btn-s btn-sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw style={{ width: 13, height: 13 }} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 380 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)' }} />
        <input className="inp" style={{ paddingLeft: 32 }} placeholder="Search by title or artist email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Release</th>
              <th>Artist</th>
              <th>Type</th>
              <th>Tracks</th>
              <th>QC</th>
              <th>Submitted</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}>
                <Loader2 style={{ width: 18, height: 18, color: 'var(--text-3)' }} className="animate-spin" />
              </td></tr>
            ) : releases.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                {search ? 'No results found' : '🎉 No releases pending review'}
              </td></tr>
            ) : releases.map((r: any) => {
              const checks = runQcChecks(r);
              const fails = checks.filter(c => c.status === 'fail').length;
              const warns = checks.filter(c => c.status === 'warn').length;
              return (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.artworkUrl
                        ? <img src={r.artworkUrl} alt={r.title} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music2 style={{ width: 14, height: 14, color: 'var(--text-4)' }} /></div>}
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.user?.email || '—'}</td>
                  <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{r.type}</td>
                  <td>{r.songs?.length || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {fails > 0 && <span className="bdg bdg-red">{fails} fail</span>}
                      {warns > 0 && <span className="bdg bdg-yellow">{warns} warn</span>}
                      {fails === 0 && warns === 0 && <span className="bdg bdg-green">Pass</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{r.submittedAt ? format(new Date(r.submittedAt), 'MMM d, HH:mm') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ok btn-sm" onClick={e => { e.stopPropagation(); setSelected(r); }}>
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QC Panel modal */}
      {selected && <ReleaseQCPanel release={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
