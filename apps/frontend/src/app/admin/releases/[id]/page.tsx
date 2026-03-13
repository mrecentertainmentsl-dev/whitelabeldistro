'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Music2, CheckCircle, XCircle, Clock, Globe,
  Loader2, Edit2, Save, X, AlertTriangle, Play, Download,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  draft:       { cls: 'bdg bdg-gray',   label: 'Draft' },
  pending:     { cls: 'bdg bdg-yellow', label: 'Pending' },
  processing:  { cls: 'bdg bdg-blue',   label: 'Processing' },
  approved:    { cls: 'bdg bdg-green',  label: 'Approved' },
  rejected:    { cls: 'bdg bdg-red',    label: 'Rejected' },
  distributed: { cls: 'bdg bdg-green',  label: 'Distributed' },
};

export default function AdminReleaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [editMeta, setEditMeta] = useState(false);
  const [meta, setMeta] = useState<any>({});

  const { data: release, isLoading } = useQuery({
    queryKey: ['admin-release', id],
    queryFn: () => api.get(`/api/v1/releases/${id}`).then(r => { setMeta(r.data); return r.data; }),
  });

  const approve = useMutation({
    mutationFn: () => api.post(`/api/v1/releases/${id}/approve`, { notes: approveNotes }),
    onSuccess: () => { toast.success('Release approved'); qc.invalidateQueries({ queryKey: ['admin-release', id] }); qc.invalidateQueries({ queryKey: ['admin-overview'] }); },
    onError: () => toast.error('Approval failed'),
  });
  const reject = useMutation({
    mutationFn: () => api.post(`/api/v1/releases/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => { toast.success('Release rejected'); qc.invalidateQueries({ queryKey: ['admin-release', id] }); setShowReject(false); },
    onError: () => toast.error('Rejection failed'),
  });
  const updateMeta = useMutation({
    mutationFn: (dto: any) => api.patch(`/api/v1/admin/releases/${id}/metadata`, dto),
    onSuccess: () => { toast.success('Metadata updated'); setEditMeta(false); qc.invalidateQueries({ queryKey: ['admin-release', id] }); },
    onError: () => toast.error('Update failed'),
  });

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><Loader2 style={{ width: 20, height: 20, color: 'var(--text-3)' }} className="animate-spin" /></div>;
  if (!release) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Release not found</div>;

  const st = STATUS_CFG[release.status] || STATUS_CFG.draft;
  const songs = release.songs || [];
  const canReview = release.status === 'pending';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} className="btn-g btn-sm">
          <ArrowLeft style={{ width: 13, height: 13 }} /> Back to Releases
        </button>
        {/* DDEX export */}
        {(release.status === 'approved' || release.status === 'distributed') && (
          <a href={`/api/v1/ddex/${id}/xml?download=1`} className="btn-s btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Download style={{ width: 13, height: 13 }} /> Export DDEX ERN 4.3 XML
          </a>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {release.artworkUrl
          ? <img src={release.artworkUrl} alt={release.title} style={{ width: 88, height: 88, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 88, height: 88, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music2 style={{ width: 28, height: 28, color: 'var(--text-4)' }} /></div>}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{release.title}</h1>
            <span className={st.cls}>{st.label}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {songs[0]?.artistName || '—'} · {release.type} · {songs.length} tracks
            {release.labelName ? ` · ${release.labelName}` : ''}
            {release.upc ? ` · UPC: ${release.upc}` : ''}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            Submitted by <strong style={{ color: 'var(--text-2)' }}>{release.user?.email}</strong>
            {release.submittedAt ? ` on ${format(new Date(release.submittedAt), 'MMM d, yyyy HH:mm')}` : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Metadata card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Metadata</span>
              <button className="btn-g btn-sm" style={{ fontSize: 11 }} onClick={() => setEditMeta(!editMeta)}>
                {editMeta ? <X style={{ width: 12, height: 12 }} /> : <Edit2 style={{ width: 12, height: 12 }} />}
                {editMeta ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {editMeta ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[['title','Title'],['genre','Genre'],['language','Language'],['labelName','Label Name'],['upc','UPC']].map(([k, lbl]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{lbl}</label>
                      <input className="inp" value={meta[k] || ''} onChange={e => setMeta((p: any) => ({ ...p, [k]: e.target.value }))} style={{ fontSize: 12 }} />
                    </div>
                  ))}
                  <button className="btn-p btn-sm" onClick={() => updateMeta.mutate(meta)} disabled={updateMeta.isPending} style={{ alignSelf: 'flex-start' }}>
                    {updateMeta.isPending ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Save style={{ width: 12, height: 12 }} />}
                    Save Changes
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    ['Type', release.type],
                    ['Genre', release.genre],
                    ['Language', release.language],
                    ['Label', release.labelName],
                    ['UPC', release.upc],
                    ['Release Date', release.releaseDate ? format(new Date(release.releaseDate), 'MMM d, yyyy') : null],
                    ['Platforms', release.distributionPlatforms?.join(', ')],
                    ['Submitted', release.submittedAt ? format(new Date(release.submittedAt), 'MMM d, yyyy HH:mm') : null],
                    ['Reviewed by', release.reviewedBy ? release.reviewedBy : null],
                  ].filter(([, v]) => v).map(([lbl, val]) => (
                    <div key={lbl as string} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{lbl}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'right', textTransform: 'capitalize', fontFamily: lbl === 'UPC' ? 'DM Mono, monospace' : undefined }}>{val as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tracks */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Tracks ({songs.length})</span>
            </div>
            {songs.map((s: any, i: number) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderBottom: i < songs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 18, textAlign: 'right', fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}{s.isExplicit ? ' 🅴' : ''}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {s.artistName}{s.isrc ? ` · ${s.isrc}` : ' · no ISRC'}
                    {s.durationSeconds ? ` · ${Math.floor(s.durationSeconds/60)}:${String(s.durationSeconds%60).padStart(2,'0')}` : ''}
                  </p>
                </div>
                {s.audioUrl
                  ? <a href={s.audioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}><Play style={{ width: 14, height: 14 }} /></a>
                  : <AlertTriangle style={{ width: 14, height: 14, color: 'var(--warning)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right col — QC actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* QC status + actions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>QC & Actions</span>
            </div>
            <div style={{ padding: '16px' }}>
              {/* Quick checks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Cover artwork', ok: !!release.artworkUrl },
                  { label: 'Tracks present', ok: songs.length > 0 },
                  { label: 'All audio uploaded', ok: songs.every((s: any) => s.audioUrl || s.audioS3Key) },
                  { label: 'ISRC codes', ok: songs.every((s: any) => s.isrc), warn: songs.some((s: any) => s.isrc) },
                  { label: 'UPC present', ok: !!release.upc, warn: true },
                  { label: 'DDEX ERN 4.3 ready', ok: songs.length > 0 && !!release.artworkUrl },
                ].map(({ label, ok, warn }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ok
                      ? <CheckCircle style={{ width: 14, height: 14, color: 'var(--success)', flexShrink: 0 }} />
                      : warn
                        ? <AlertTriangle style={{ width: 14, height: 14, color: 'var(--warning)', flexShrink: 0 }} />
                        : <XCircle style={{ width: 14, height: 14, color: 'var(--danger)', flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
                  </div>
                ))}
              </div>

              {canReview && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Notes for artist (optional)</label>
                    <textarea className="inp" rows={2} value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder="Any notes…" style={{ fontSize: 12 }} />
                  </div>
                  <button className="btn-ok" onClick={() => approve.mutate()} disabled={approve.isPending} style={{ width: '100%', justifyContent: 'center', marginBottom: 8, padding: '8px' }}>
                    {approve.isPending ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <CheckCircle style={{ width: 13, height: 13 }} />}
                    Approve Release
                  </button>
                  <button className="btn-danger" onClick={() => setShowReject(!showReject)} style={{ width: '100%', justifyContent: 'center', padding: '8px' }}>
                    <XCircle style={{ width: 13, height: 13 }} />
                    Reject Release
                    {showReject ? <ChevronUp style={{ width: 13, height: 13, marginLeft: 'auto' }} /> : <ChevronDown style={{ width: 13, height: 13, marginLeft: 'auto' }} />}
                  </button>
                  {showReject && (
                    <div className="fade-in" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea className="inp" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Describe what needs to be fixed…" style={{ fontSize: 12 }} />
                      <button className="btn-danger" onClick={() => { if (!rejectReason.trim()) { toast.error('Reason required'); return; } reject.mutate(); }} disabled={reject.isPending} style={{ justifyContent: 'center' }}>
                        {reject.isPending ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : null}
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </>
              )}

              {!canReview && (
                <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--text-3)' }}>
                  Status: <span className={st.cls} style={{ marginLeft: 4 }}>{st.label}</span>
                  {release.adminNotes && <p style={{ marginTop: 6, color: 'var(--text-3)' }}>Notes: {release.adminNotes}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Submission notes */}
          {release.submissionNotes && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Artist Notes</span>
              </div>
              <p style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{release.submissionNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
