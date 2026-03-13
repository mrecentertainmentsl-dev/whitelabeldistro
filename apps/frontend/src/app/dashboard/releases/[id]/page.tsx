'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Music2, Clock, CheckCircle, XCircle, Globe,
  Edit2, Save, X, Play, Loader2, AlertTriangle, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const STATUS_CFG: Record<string, { cls: string; label: string; desc: string }> = {
  draft:       { cls: 'bdg bdg-gray',   label: 'Draft',       desc: 'Not submitted yet.' },
  pending:     { cls: 'bdg bdg-yellow', label: 'Pending',     desc: 'Under review. You\'ll be notified within 24-48 hours.' },
  processing:  { cls: 'bdg bdg-blue',   label: 'Processing',  desc: 'Being prepared for distribution.' },
  approved:    { cls: 'bdg bdg-green',  label: 'Approved',    desc: 'Approved and queued for distribution.' },
  rejected:    { cls: 'bdg bdg-red',    label: 'Rejected',    desc: 'Review the feedback below and resubmit.' },
  distributed: { cls: 'bdg bdg-green',  label: 'Distributed', desc: 'Live on all selected platforms.' },
};

function fmtDuration(s?: number) {
  if (!s) return '—';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ReleaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: release, isLoading } = useQuery({
    queryKey: ['release', id],
    queryFn: () => api.get(`/api/v1/releases/${id}`).then(r => r.data),
  });

  const submit = useMutation({
    mutationFn: () => api.post(`/api/v1/releases/${id}/submit`),
    onSuccess: () => { toast.success('Submitted for review!'); qc.invalidateQueries({ queryKey: ['release', id] }); },
    onError: () => toast.error('Submit failed'),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <Loader2 style={{ width: 20, height: 20, color: 'var(--text-3)' }} className="animate-spin" />
    </div>
  );
  if (!release) return <div style={{ color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>Release not found</div>;

  const st = STATUS_CFG[release.status] || STATUS_CFG.draft;
  const songs = release.songs || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Back + header */}
      <div>
        <button onClick={() => router.back()} className="btn-g btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {release.artworkUrl
            ? <img src={release.artworkUrl} alt={release.title} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Music2 style={{ width: 28, height: 28, color: 'var(--text-4)' }} />
              </div>}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{release.title}</h1>
              <span className={st.cls}>{st.label}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {songs[0]?.artistName || '—'} · {release.type} · {songs.length} track{songs.length !== 1 ? 's' : ''}
              {release.labelName ? ` · ${release.labelName}` : ''}
            </p>
            {st.desc && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{st.desc}</p>}
            {release.status === 'rejected' && release.rejectedReason && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 12, color: '#fca5a5' }}>
                <strong>Reason:</strong> {release.rejectedReason}
              </div>
            )}
          </div>
          {release.status === 'draft' && (
            <button className="btn-p" onClick={() => submit.mutate()} disabled={submit.isPending}>
              {submit.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
              Submit for Review
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Metadata */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Release Info</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Release ID', release.releaseId || release.id?.slice(0,12)],
              ['Type', release.type],
              ['Genre', release.genre],
              ['Language', release.language],
              ['Label', release.labelName],
              ['UPC', release.upc],
              ['Release Date', release.releaseDate ? format(new Date(release.releaseDate), 'MMM d, yyyy') : null],
              ['Created', format(new Date(release.createdAt), 'MMM d, yyyy')],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'right', textTransform: 'capitalize', fontFamily: label === 'UPC' || label === 'Release ID' ? 'DM Mono, monospace' : undefined }}>{val as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Distribution</div>
          <div style={{ padding: 16 }}>
            {release.distributionPlatforms?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {release.distributionPlatforms.map((p: string) => (
                  <span key={p} className="bdg bdg-gray" style={{ textTransform: 'capitalize' }}>{p.replace('_', ' ')}</span>
                ))}
              </div>
            ) : <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No platforms selected</p>}

            {release.status === 'distributed' && (
              <div style={{ marginTop: 14, padding: '8px 12px', background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, fontSize: 12, color: '#86efac' }}>
                ✓ Live on all platforms · DDEX ERN 4.3 distributed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Tracks ({songs.length})</span>
          {release.status === 'draft' && (
            <Link href={`/dashboard/upload?edit=${id}`} className="btn-s btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 4, fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              <Edit2 style={{ width: 11, height: 11 }} /> Edit
            </Link>
          )}
        </div>
        {songs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No tracks added</div>
        ) : songs.map((s: any, i: number) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderBottom: i < songs.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ width: 18, textAlign: 'right', fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title}{s.isExplicit ? ' 🅴' : ''}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {s.artistName}
                {s.isrc ? ` · ${s.isrc}` : ''}
              </p>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}>{fmtDuration(s.durationSeconds)}</span>
            {s.audioUrl
              ? <a href={s.audioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}><Play style={{ width: 14, height: 14 }} /></a>
              : <AlertTriangle style={{ width: 14, height: 14, color: 'var(--warning)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
