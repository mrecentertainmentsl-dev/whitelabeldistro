'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  Upload, Check, X, Info, AlertCircle, Globe, Loader2,
  Image as ImageIcon, Music2, User, Disc, Send, Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DISTRIBUTION_PLATFORMS } from '@mrec/shared/src/types';
import { useWizard, Field, Row2, Row3, SectionTitle, Toggle } from './wizard-parts';

// ─── Step 6: Artwork ──────────────────────────────────────────────────────────

export function Step6() {
  const { data, update } = useWizard();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(data.artworkUrl || null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDrop: useCallback(async (files: File[]) => {
      const file = files[0]; if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      // Validate dimensions
      const img = new window.Image();
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 3000 || img.height < 3000) {
          toast.error(`Artwork must be at least 3000×3000 px (yours: ${img.width}×${img.height})`);
          return;
        }
        if (img.width !== img.height) {
          toast.error('Artwork must be square');
          return;
        }
        setUploading(true);
        try {
          const { data: p } = await api.post('/api/v1/uploads/presign', {
            filename: file.name, contentType: file.type, uploadType: 'artwork',
          });
          await fetch(p.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          update({ artworkUrl: p.fileUrl, artworkS3Key: p.s3Key, artworkWidth: img.width, artworkHeight: img.height });
          setPreview(p.fileUrl);
          toast.success('Artwork uploaded');
        } catch {
          toast.error('Artwork upload failed');
        } finally {
          setUploading(false);
        }
      };
      img.src = objectUrl;
    }, []),
    onDropRejected: (r) => toast.error(r[0]?.errors[0]?.message || 'File rejected'),
  });

  const clear = () => { update({ artworkUrl: '', artworkS3Key: '', artworkWidth: 0, artworkHeight: 0 }); setPreview(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Cover artwork that appears across all streaming platforms.">
        Cover Artwork
      </SectionTitle>

      {/* Requirements callout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { ok: true, text: 'JPG or PNG format' },
          { ok: true, text: 'Square aspect ratio (1:1)' },
          { ok: true, text: 'Minimum 3000 × 3000 pixels' },
          { ok: true, text: 'RGB colour space' },
          { ok: false, text: 'No website URLs or social handles' },
          { ok: false, text: 'No pixelation or blurriness' },
        ].map(({ ok, text }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-3)' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? 'var(--success-dim)' : 'var(--danger-dim)', border: `1px solid ${ok ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}` }}>
              {ok ? <Check style={{ width: 9, height: 9, color: 'var(--success)' }} /> : <X style={{ width: 9, height: 9, color: 'var(--danger)' }} />}
            </div>
            {text}
          </div>
        ))}
      </div>

      {/* Drop area + preview */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Drop zone */}
        <div {...getRootProps()} style={{
          flex: 1, minHeight: 220,
          border: `2px dashed ${isDragActive ? 'var(--primary)' : data.artworkUrl ? 'rgba(34,197,94,.4)' : 'var(--border-2)'}`,
          borderRadius: 10, background: isDragActive ? 'var(--primary-dim)' : 'var(--surface)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, cursor: 'pointer', transition: 'all .12s', padding: 24,
        }}>
          <input {...getInputProps()} />
          {uploading
            ? <Loader2 style={{ width: 32, height: 32, color: 'var(--primary)' }} className="animate-spin" />
            : data.artworkUrl
              ? <Check style={{ width: 32, height: 32, color: 'var(--success)' }} />
              : <ImageIcon style={{ width: 32, height: 32, color: 'var(--text-4)' }} />}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: uploading ? 'var(--primary)' : data.artworkUrl ? 'var(--success)' : 'var(--text-2)' }}>
              {uploading ? 'Uploading artwork…' : data.artworkUrl ? 'Artwork uploaded ✓' : isDragActive ? 'Drop image here' : 'Browse or drag image'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              JPG / PNG · Min 3000×3000 px · Max 50 MB
            </p>
          </div>
          {data.artworkUrl && (
            <button onClick={e => { e.stopPropagation(); clear(); }} className="btn-s btn-sm">
              <X style={{ width: 12, height: 12 }} /> Remove
            </button>
          )}
        </div>

        {/* Preview */}
        <div style={{
          width: 220, height: 220, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {preview
            ? <img src={preview} alt="Artwork preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <ImageIcon style={{ width: 36, height: 36, color: 'var(--text-4)' }} />
                <p style={{ fontSize: 11, color: 'var(--text-4)' }}>Preview</p>
              </div>
            )}
        </div>
      </div>

      {data.artworkWidth > 0 && (
        <div className="callout-ok" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Check style={{ width: 13, height: 13, flexShrink: 0 }} />
          Artwork verified: {data.artworkWidth}×{data.artworkHeight}px · meets all requirements
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Rights & Distribution ───────────────────────────────────────────

export function Step7() {
  const { data, update } = useWizard();

  const togglePlatform = (id: string) => {
    const sel = data.distributionPlatforms.includes(id);
    update({
      distributionPlatforms: sel
        ? data.distributionPlatforms.filter(p => p !== id)
        : [...data.distributionPlatforms, id],
    });
  };
  const allSelected = data.distributionPlatforms.length === DISTRIBUTION_PLATFORMS.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Choose where this release will be delivered. You can change platforms before approval.">
        Rights & Distribution
      </SectionTitle>

      {/* Platform grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Distribution Platforms
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
              ({data.distributionPlatforms.length} selected)
            </span>
          </span>
          <button className="btn-g btn-sm" onClick={() => update({
            distributionPlatforms: allSelected ? [] : DISTRIBUTION_PLATFORMS.map(p => p.id),
          })}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {DISTRIBUTION_PLATFORMS.map(p => {
            const sel = data.distributionPlatforms.includes(p.id);
            return (
              <div key={p.id}
                onClick={() => togglePlatform(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 8, cursor: 'pointer', transition: 'all .12s',
                  background: sel ? 'var(--surface-2)' : 'var(--surface)',
                  border: `1px solid ${sel ? 'var(--border-2)' : 'var(--border)'}`,
                }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: sel ? 'var(--text)' : 'var(--text-2)' }}>{p.name}</span>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: sel ? 'var(--primary)' : 'var(--surface-3)',
                  border: `1px solid ${sel ? 'var(--primary)' : 'var(--border-2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Check style={{ width: 11, height: 11, color: '#000' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Scheduled time */}
      <Field label="Scheduled Release Time" hint="Optional — set a specific time on the release date (UTC)">
        <input className="inp" type="time" value={data.scheduledReleaseTime}
          onChange={e => update({ scheduledReleaseTime: e.target.value })} />
      </Field>

      <div className="callout-info" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0 }} />
        <span>Territory restrictions for distribution were configured in Step 1. Your release will only be distributed to the selected territories on the selected platforms.</span>
      </div>
    </div>
  );
}

// ─── Step 8: Review & Submit ──────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value?: string | number | React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)', width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{value}</span>
    </div>
  );
}

export function Step8() {
  const { data, update } = useWizard();
  const RELEASE_TYPE_LABELS: Record<string, string> = {
    single: 'Single', ep: 'EP', album: 'Album',
    compilation: 'Compilation', soundtrack: 'Soundtrack', live: 'Live',
  };
  const PA_LABELS: Record<string, string> = { none: 'Not Explicit', explicit: 'Explicit', cleaned: 'Cleaned / Edited' };

  const selectedPlatforms = DISTRIBUTION_PLATFORMS.filter(p => data.distributionPlatforms.includes(p.id));
  const roleLabel = (id: string) => {
    const { ARTIST_ROLES } = require('@mrec/shared/src/types');
    return ARTIST_ROLES.find((r: any) => r.id === id)?.label || id;
  };

  // Issues validation
  const issues: string[] = [];
  if (!data.title) issues.push('Release title is missing');
  if (!data.genre) issues.push('Genre is required');
  if (!data.releaseDate) issues.push('Release date is required');
  if (data.artists.length === 0 || !data.artists.some(a => a.role === 'primary_artist' && a.name)) issues.push('At least one Primary Artist is required');
  if (data.tracks.length === 0) issues.push('No tracks added');
  if (data.tracks.some(t => !t.audioUrl)) issues.push('Some tracks are missing audio files');
  if (!data.artworkUrl) issues.push('Cover artwork is required');
  if (data.distributionPlatforms.length === 0) issues.push('No distribution platforms selected');

  const songwriters = data.publishing.filter(p => p.type === 'songwriter');
  const totalSW = songwriters.reduce((s, p) => s + p.sharePercent, 0);
  if (songwriters.length > 0 && Math.abs(totalSW - 100) >= 0.01) issues.push(`Songwriter shares total ${totalSW.toFixed(1)}% (must be 100%)`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Review all metadata before submitting for QC. You can go back to any step to make edits.">
        Review & Submit
      </SectionTitle>

      {issues.length > 0 && (
        <div className="callout-err" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <AlertCircle style={{ width: 14, height: 14 }} />
            {issues.length} issue{issues.length > 1 ? 's' : ''} must be resolved before submitting
          </div>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {issues.map((iss, i) => <li key={i} style={{ fontSize: 12, marginTop: 3 }}>{iss}</li>)}
          </ul>
        </div>
      )}

      {issues.length === 0 && (
        <div className="callout-ok" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Check style={{ width: 14, height: 14 }} />
          All required fields are complete — ready to submit for QC review.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: release info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Artwork + title */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
              {data.artworkUrl
                ? <img src={data.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music2 style={{ width: 22, height: 22, color: 'var(--text-4)' }} /></div>}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{data.title || 'Untitled Release'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {data.artists.filter(a => a.role === 'primary_artist').map(a => a.name).join(', ') || '—'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {RELEASE_TYPE_LABELS[data.type] || data.type} · {data.genre}
              </p>
            </div>
          </div>

          {/* Release details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Release Details</p>
            <MetaRow label="Type" value={RELEASE_TYPE_LABELS[data.type]} />
            <MetaRow label="Genre" value={[data.genre, data.subgenre].filter(Boolean).join(' › ')} />
            <MetaRow label="Language" value={data.language} />
            <MetaRow label="Label" value={data.labelName || 'Self-released'} />
            <MetaRow label="Parental Advisory" value={PA_LABELS[data.parentalAdvisory]} />
            <MetaRow label="Release Date" value={data.releaseDate} />
            <MetaRow label="Original Release" value={data.originalReleaseDate} />
            <MetaRow label="UPC" value={data.upc || 'Auto-assigned'} />
            <MetaRow label="Territories" value={data.territories.includes('worldwide') ? 'Worldwide' : `${data.territories.length} territories`} />
          </div>

          {/* Artists */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Artists ({data.artists.length})</p>
            {data.artists.map((a, i) => (
              <div key={a._key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < data.artists.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{a.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{roleLabel(a.role)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: tracks, platforms, contributors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tracks */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Tracks ({data.tracks.length})</p>
            {data.tracks.length === 0
              ? <p style={{ fontSize: 12, color: 'var(--danger)' }}>No tracks added</p>
              : data.tracks.map((t, i) => (
                  <div key={t._key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < data.tracks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-4)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title || <span style={{ color: 'var(--danger)' }}>Untitled</span>}
                        {t.isExplicit && <span className="bdg bdg-red" style={{ fontSize: 9, marginLeft: 4 }}>E</span>}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.isrc || 'No ISRC'}</p>
                    </div>
                    {t.audioUrl
                      ? <Check style={{ width: 12, height: 12, color: 'var(--success)', flexShrink: 0 }} />
                      : <AlertCircle style={{ width: 12, height: 12, color: 'var(--danger)', flexShrink: 0 }} />}
                  </div>
                ))}
          </div>

          {/* Platforms */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
              Platforms ({selectedPlatforms.length})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedPlatforms.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contributors summary */}
          {data.contributors.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Contributors ({data.contributors.length})
              </p>
              {data.contributors.slice(0, 4).map((c, i) => (
                <div key={c._key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < Math.min(data.contributors.length, 4) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.role}</span>
                </div>
              ))}
              {data.contributors.length > 4 && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>+{data.contributors.length - 4} more</p>
              )}
            </div>
          )}

          {/* Publishing summary */}
          {data.publishing.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Publishing ({data.publishing.length})
              </p>
              {data.publishing.map((p, i) => (
                <div key={p._key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < data.publishing.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.type === 'songwriter' ? 'Writer' : 'Publisher'} · {p.sharePercent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submission notes */}
      <Field label="Notes for reviewer" hint="Optional context for the QC team">
        <textarea className="inp" rows={3} value={data.submissionNotes}
          onChange={e => update({ submissionNotes: e.target.value })}
          placeholder="Any notes for the review team…" />
      </Field>
    </div>
  );
}
