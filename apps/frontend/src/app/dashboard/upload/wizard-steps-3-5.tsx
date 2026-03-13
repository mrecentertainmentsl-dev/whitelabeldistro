'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  Plus, X, ChevronDown, ChevronUp, Upload, Loader2, Check,
  Music2, AlertCircle, Info, User, Trash2, Copy, Disc,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { LANGUAGES, ARTIST_ROLES, CONTRIBUTOR_ROLES, PRO_AFFILIATIONS } from '@mrec/shared/src/types';
import {
  useWizard, Field, Row2, Row3, SectionTitle, Toggle, CreditPill, ArtistModal, mk,
} from './wizard-parts';
import type { TrackData, ArtistCredit, ContributorCredit, PublishingShare } from './wizard-parts';

// ─── Audio Dropzone (per track) ───────────────────────────────────────────────

function AudioDrop({ track, onUpdate }: { track: TrackData; onUpdate: (k: string, v: any) => void }) {
  const { user } = useAuthStore();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'audio/wav': ['.wav'], 'audio/flac': ['.flac'], 'audio/x-flac': ['.flac'], 'audio/aiff': ['.aiff', '.aif'] },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024,
    onDrop: async (files) => {
      const file = files[0]; if (!file) return;
      onUpdate('uploading', true);
      try {
        const { data: p } = await api.post('/api/v1/uploads/presign', {
          filename: file.name, contentType: file.type, uploadType: 'audio',
        });
        await fetch(p.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        onUpdate('audioUrl', p.fileUrl);
        onUpdate('audioS3Key', p.s3Key);
        onUpdate('audioFormat', file.name.split('.').pop()?.toLowerCase() || '');
        onUpdate('audioSizeBytes', file.size);
        toast.success(`${file.name} uploaded`);
      } catch {
        toast.error('Upload failed');
      } finally {
        onUpdate('uploading', false);
      }
    },
    onDropRejected: (r) => toast.error(r[0]?.errors[0]?.message || 'File rejected'),
  });

  function fmtSize(bytes: number) {
    if (!bytes) return '';
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  if (track.audioUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 7 }}>
        <Check style={{ width: 14, height: 14, color: 'var(--success)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>Audio uploaded</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {track.audioFormat?.toUpperCase()} · {fmtSize(track.audioSizeBytes)}
          </p>
        </div>
        <button onClick={() => { onUpdate('audioUrl', ''); onUpdate('audioS3Key', ''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    );
  }

  return (
    <div {...getRootProps()} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      background: isDragActive ? 'var(--primary-dim)' : 'var(--surface)',
      border: `1px dashed ${isDragActive ? 'var(--primary)' : 'var(--border-2)'}`,
      borderRadius: 7, cursor: 'pointer', transition: 'all .12s',
    }}>
      <input {...getInputProps()} />
      {track.uploading
        ? <Loader2 style={{ width: 18, height: 18, color: 'var(--primary)', flexShrink: 0 }} className="animate-spin" />
        : <Upload style={{ width: 18, height: 18, color: 'var(--text-3)', flexShrink: 0 }} />}
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          {track.uploading ? 'Uploading…' : isDragActive ? 'Drop audio file' : 'Upload audio'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>WAV or FLAC · Max 1 GB · 44.1 kHz / 16-bit minimum</p>
      </div>
    </div>
  );
}

// ─── Contributor Modal ────────────────────────────────────────────────────────

function ContribModal({ contrib, onSave, onClose }: {
  contrib: ContributorCredit; onSave: (c: ContributorCredit) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...contrib });
  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const categories = [...new Set(CONTRIBUTOR_ROLES.map(r => r.category))];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, width: '100%', maxWidth: 480, padding: 24 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            {contrib.name ? 'Edit Contributor' : 'Add Contributor'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Name" required>
            <input className="inp" value={form.name} onChange={e => up('name', e.target.value)} placeholder="Full name" autoFocus />
          </Field>
          <Field label="Role" required>
            <select className="inp" value={form.role} onChange={e => up('role', e.target.value)}>
              {categories.map(cat => (
                <optgroup key={cat} label={cat}>
                  {CONTRIBUTOR_ROLES.filter(r => r.category === cat).map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Row2>
            <Field label="IPI Number" hint="Interested Party Information number">
              <input className="inp" value={form.ipiNumber || ''} onChange={e => up('ipiNumber', e.target.value)}
                placeholder="e.g. 00264887232" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
            </Field>
            <Field label="PRO Affiliation">
              <select className="inp" value={form.proAffiliation || ''} onChange={e => up('proAffiliation', e.target.value)}>
                <option value="">None</option>
                {PRO_AFFILIATIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </Row2>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-s" onClick={onClose}>Cancel</button>
          <button className="btn-p" onClick={() => { if (!form.name) return toast.error('Name required'); onSave(form); }}>
            <Check style={{ width: 14, height: 14 }} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Track Artist Sub-panel ────────────────────────────────────────────────────

function TrackArtistsPanel({ trackIdx }: { trackIdx: number }) {
  const { data, update } = useWizard();
  const track = data.tracks[trackIdx];
  const [modal, setModal] = useState<ArtistCredit | null>(null);

  const saveArtist = (a: ArtistCredit) => {
    const updated = [...data.tracks];
    const exists = updated[trackIdx].artists.find(x => x._key === a._key);
    if (exists) {
      updated[trackIdx] = { ...updated[trackIdx], artists: updated[trackIdx].artists.map(x => x._key === a._key ? a : x) };
    } else {
      updated[trackIdx] = { ...updated[trackIdx], artists: [...updated[trackIdx].artists, a] };
    }
    update({ tracks: updated });
    setModal(null);
  };
  const removeArtist = (_key: string) => {
    const updated = [...data.tracks];
    updated[trackIdx] = { ...updated[trackIdx], artists: updated[trackIdx].artists.filter(x => x._key !== _key) };
    update({ tracks: updated });
  };
  const roleLabel = (id: string) => ARTIST_ROLES.find(r => r.id === id)?.label || id;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Track Artists</span>
        <button className="btn-g btn-sm" style={{ fontSize: 11 }}
          onClick={() => setModal({ _key: mk(), name: '', role: 'primary_artist' })}>
          <Plus style={{ width: 11, height: 11 }} /> Add
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {track.artists.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic', padding: '4px 0' }}>
            Inherits release artists — override here for track-specific credits
          </p>
        )}
        {track.artists.map(a => (
          <CreditPill key={a._key} name={a.name} role={roleLabel(a.role)}
            onEdit={() => setModal(a)} onRemove={() => removeArtist(a._key)} />
        ))}
      </div>
      {modal && <ArtistModal artist={modal} onSave={saveArtist} onClose={() => setModal(null)} />}
    </>
  );
}

// ─── Single Track Card ────────────────────────────────────────────────────────

function TrackCard({ idx, track }: { idx: number; track: TrackData }) {
  const { data, update } = useWizard();
  const [expanded, setExpanded] = useState(idx === 0);

  const upTrack = (k: string, v: any) => {
    const updated = [...data.tracks];
    updated[idx] = { ...updated[idx], [k]: v };
    update({ tracks: updated });
  };
  const removeTrack = () => update({ tracks: data.tracks.filter((_, i) => i !== idx) });

  // Duration display
  const dur = track.durationSeconds;
  const durStr = dur ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}` : null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', cursor: 'pointer', userSelect: 'none',
        background: expanded ? 'var(--surface-2)' : 'var(--surface)',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{idx + 1}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: track.title ? 'var(--text)' : 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.title || 'Untitled Track'}
            {track.titleVersion ? <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> — {track.titleVersion}</span> : null}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {[
              track.isrc && <span key="isrc" style={{ fontFamily: 'DM Mono, monospace' }}>{track.isrc}</span>,
              track.isExplicit && <span key="e" className="bdg bdg-red" style={{ fontSize: 10 }}>E</span>,
              durStr && <span key="dur">{durStr}</span>,
              track.audioUrl && <span key="aud" style={{ color: 'var(--success)' }}>✓ Audio</span>,
            ].filter(Boolean).reduce((acc: any[], el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} style={{ color: 'var(--text-4)' }}> · </span>, el], [])}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); removeTrack(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}>
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
          {expanded
            ? <ChevronUp style={{ width: 15, height: 15, color: 'var(--text-3)' }} />
            : <ChevronDown style={{ width: 15, height: 15, color: 'var(--text-3)' }} />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row2>
            <Field label="Track Title" required>
              <input className="inp" value={track.title} onChange={e => upTrack('title', e.target.value)} placeholder="Track title" />
            </Field>
            <Field label="Version / Mix" hint='e.g. "Radio Edit", "Acoustic", "Club Mix"'>
              <input className="inp" value={track.titleVersion} onChange={e => upTrack('titleVersion', e.target.value)} placeholder="Optional" />
            </Field>
          </Row2>

          <Row3>
            <Field label="ISRC" hint="International Standard Recording Code">
              <input className="inp" value={track.isrc} onChange={e => upTrack('isrc', e.target.value)}
                placeholder="e.g. GBDUW1100001" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
            </Field>
            <Field label="Track #">
              <input className="inp" type="number" min={1} value={track.trackNumber}
                onChange={e => upTrack('trackNumber', parseInt(e.target.value) || 1)} />
            </Field>
            <Field label="Disc #">
              <input className="inp" type="number" min={1} value={track.discNumber}
                onChange={e => upTrack('discNumber', parseInt(e.target.value) || 1)} />
            </Field>
          </Row3>

          <Row2>
            <Field label="Language">
              <select className="inp" value={track.language} onChange={e => upTrack('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Explicit">
              <div style={{ display: 'flex', alignItems: 'center', height: 34, gap: 8 }}>
                <Toggle on={track.isExplicit} onChange={() => upTrack('isExplicit', !track.isExplicit)}
                  label={track.isExplicit ? 'Explicit content' : 'Not explicit'} />
              </div>
            </Field>
          </Row2>

          {/* Audio upload */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>
              Audio File <span style={{ color: 'var(--danger)', fontSize: 11 }}>*</span>
            </label>
            <AudioDrop track={track} onUpdate={upTrack} />
          </div>

          {/* Track-level artist credits */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: 12 }}>
            <TrackArtistsPanel trackIdx={idx} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Tracklist ────────────────────────────────────────────────────────

export function Step3() {
  const { data, update } = useWizard();
  const addTrack = () => {
    update({
      tracks: [...data.tracks, {
        _key: mk(),
        title: '',
        titleVersion: '',
        trackNumber: data.tracks.length + 1,
        discNumber: 1,
        isrc: '',
        isExplicit: false,
        language: data.language || 'English',
        audioUrl: '',
        audioS3Key: '',
        audioFormat: '',
        durationSeconds: 0,
        audioSizeBytes: 0,
        uploading: false,
        artists: [],
        contributors: [],
        publishing: [],
      }],
    });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle sub="Add all tracks for this release. Each track requires a WAV or FLAC audio file.">
        Tracklist
      </SectionTitle>

      {data.tracks.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: 8 }}>
          <Music2 style={{ width: 28, height: 28, color: 'var(--text-4)', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>No tracks yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Add your first track to get started</p>
          <button className="btn-p" onClick={addTrack}><Plus style={{ width: 14, height: 14 }} /> Add Track</button>
        </div>
      )}

      {data.tracks.map((t, i) => <TrackCard key={t._key} idx={i} track={t} />)}

      {data.tracks.length > 0 && (
        <button className="btn-s" onClick={addTrack} style={{ alignSelf: 'flex-start' }}>
          <Plus style={{ width: 13, height: 13 }} /> Add Track
        </button>
      )}

      {data.type !== 'single' && data.tracks.length > 1 && (
        <div className="callout-info" style={{ display: 'flex', gap: 8 }}>
          <Info style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
          <span>Use disc numbers to organise multi-disc releases.</span>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Contributors ─────────────────────────────────────────────────────

export function Step4() {
  const { data, update } = useWizard();
  const [modal, setModal] = useState<ContributorCredit | null>(null);

  const saveContrib = (c: ContributorCredit) => {
    const exists = data.contributors.find(x => x._key === c._key);
    if (exists) {
      update({ contributors: data.contributors.map(x => x._key === c._key ? c : x) });
    } else {
      update({ contributors: [...data.contributors, c] });
    }
    setModal(null);
  };
  const removeContrib = (_key: string) => update({ contributors: data.contributors.filter(x => x._key !== _key) });
  const roleLabel = (id: string) => CONTRIBUTOR_ROLES.find(r => r.id === id)?.label || id;

  const grouped = CONTRIBUTOR_ROLES.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, typeof CONTRIBUTOR_ROLES[number][]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Recording credits that will appear in DSP liner notes and streaming metadata.">
        Production & Performance Credits
      </SectionTitle>

      <div className="callout-info" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0 }} />
        <span>These are <strong>release-level</strong> contributors. Track-specific credits can be added inside each track in Step 3. IPI numbers and PRO affiliations are used for royalty processing.</span>
      </div>

      {/* Quick-add role buttons */}
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Quick add common roles:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['mixer', 'mastering_engineer', 'recording_engineer', 'producer', 'composer', 'lyricist', 'arranger'].map(roleId => {
            const role = CONTRIBUTOR_ROLES.find(r => r.id === roleId);
            if (!role) return null;
            return (
              <button key={roleId} className="btn-s btn-sm"
                onClick={() => setModal({ _key: mk(), name: '', role: roleId })}>
                <Plus style={{ width: 11, height: 11 }} /> {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.contributors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.contributors.map(c => (
            <CreditPill key={c._key}
              name={c.name}
              role={`${roleLabel(c.role)}${c.proAffiliation ? ` · ${c.proAffiliation}` : ''}`}
              onEdit={() => setModal(c)}
              onRemove={() => removeContrib(c._key)}
            />
          ))}
        </div>
      )}

      <button className="btn-s" onClick={() => setModal({ _key: mk(), name: '', role: 'mixer' })}
        style={{ alignSelf: 'flex-start' }}>
        <Plus style={{ width: 13, height: 13 }} /> Add Contributor
      </button>

      {modal && <ContribModal contrib={modal} onSave={saveContrib} onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── Publishing Modal ─────────────────────────────────────────────────────────

function PublishModal({ pub, onSave, onClose }: {
  pub: PublishingShare; onSave: (p: PublishingShare) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...pub });
  const up = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, width: '100%', maxWidth: 460, padding: 24 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            {form.type === 'songwriter' ? 'Songwriter / Writer Share' : 'Publisher Share'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Type" required>
            <select className="inp" value={form.type} onChange={e => up('type', e.target.value)}>
              <option value="songwriter">Songwriter / Writer</option>
              <option value="publisher">Publisher</option>
            </select>
          </Field>
          <Field label="Name" required>
            <input className="inp" value={form.name} onChange={e => up('name', e.target.value)} placeholder="Full name or company" autoFocus />
          </Field>
          <Field label="Share %" required hint="Must total 100% across all writers/publishers">
            <div style={{ position: 'relative' }}>
              <input className="inp" type="number" min={0} max={100} step={0.01}
                value={form.sharePercent} onChange={e => up('sharePercent', parseFloat(e.target.value) || 0)}
                style={{ paddingRight: 30 }} />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-3)' }}>%</span>
            </div>
          </Field>
          <Row2>
            <Field label="IPI Number" hint="Interested Party Information">
              <input className="inp" value={form.ipiNumber || ''} onChange={e => up('ipiNumber', e.target.value)}
                placeholder="e.g. 00264887232" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
            </Field>
            <Field label="PRO Affiliation">
              <select className="inp" value={form.proAffiliation || ''} onChange={e => up('proAffiliation', e.target.value)}>
                <option value="">None</option>
                {PRO_AFFILIATIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </Row2>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-s" onClick={onClose}>Cancel</button>
          <button className="btn-p" onClick={() => {
            if (!form.name) return toast.error('Name required');
            if (form.sharePercent <= 0) return toast.error('Share must be > 0');
            onSave(form);
          }}>
            <Check style={{ width: 14, height: 14 }} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Publishing Metadata ──────────────────────────────────────────────

export function Step5() {
  const { data, update } = useWizard();
  const [modal, setModal] = useState<PublishingShare | null>(null);

  const savePub = (p: PublishingShare) => {
    const exists = data.publishing.find(x => x._key === p._key);
    if (exists) {
      update({ publishing: data.publishing.map(x => x._key === p._key ? p : x) });
    } else {
      update({ publishing: [...data.publishing, p] });
    }
    setModal(null);
  };
  const removePub = (_key: string) => update({ publishing: data.publishing.filter(x => x._key !== _key) });

  const songwriters = data.publishing.filter(p => p.type === 'songwriter');
  const publishers = data.publishing.filter(p => p.type === 'publisher');
  const totalSongwriter = songwriters.reduce((s, p) => s + p.sharePercent, 0);
  const totalPublisher = publishers.reduce((s, p) => s + p.sharePercent, 0);
  const totalOk = Math.abs(totalSongwriter - 100) < 0.01 || songwriters.length === 0;
  const pubOk = Math.abs(totalPublisher - 100) < 0.01 || publishers.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Songwriter and publisher information for royalty registration and collection.">
        Publishing & Songwriting
      </SectionTitle>

      <div className="callout-info" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0 }} />
        <span>Songwriter shares and publisher shares should each total <strong>100%</strong>. IPI numbers are used to match royalty payments to the correct rights holders. This data is submitted to DSPs alongside DDEX delivery.</span>
      </div>

      {/* Songwriters */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Songwriters / Writers</span>
            {songwriters.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: totalOk ? 'var(--success)' : 'var(--danger)',
                background: totalOk ? 'var(--success-dim)' : 'var(--danger-dim)',
                border: `1px solid ${totalOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                padding: '2px 8px', borderRadius: 4,
              }}>
                {totalSongwriter.toFixed(0)}%
              </span>
            )}
          </div>
          <button className="btn-s btn-sm"
            onClick={() => setModal({ _key: mk(), type: 'songwriter', name: '', sharePercent: 0 })}>
            <Plus style={{ width: 12, height: 12 }} /> Add Songwriter
          </button>
        </div>
        {songwriters.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>No songwriters added — optional but recommended</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {songwriters.map(p => (
                <CreditPill key={p._key}
                  name={p.name}
                  role={`Writer · ${p.sharePercent}%${p.proAffiliation ? ` · ${p.proAffiliation}` : ''}`}
                  onEdit={() => setModal(p)}
                  onRemove={() => removePub(p._key)}
                />
              ))}
            </div>}
      </div>

      {!totalOk && songwriters.length > 0 && (
        <div className="callout-err" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <X style={{ width: 13, height: 13, flexShrink: 0 }} />
          Songwriter shares total {totalSongwriter.toFixed(2)}% — must equal 100%.
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Publishers */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Publishers</span>
            {publishers.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: pubOk ? 'var(--success)' : 'var(--danger)',
                background: pubOk ? 'var(--success-dim)' : 'var(--danger-dim)',
                border: `1px solid ${pubOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                padding: '2px 8px', borderRadius: 4,
              }}>
                {totalPublisher.toFixed(0)}%
              </span>
            )}
          </div>
          <button className="btn-s btn-sm"
            onClick={() => setModal({ _key: mk(), type: 'publisher', name: '', sharePercent: 0 })}>
            <Plus style={{ width: 12, height: 12 }} /> Add Publisher
          </button>
        </div>
        {publishers.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>No publishers added — optional</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {publishers.map(p => (
                <CreditPill key={p._key}
                  name={p.name}
                  role={`Publisher · ${p.sharePercent}%${p.proAffiliation ? ` · ${p.proAffiliation}` : ''}`}
                  onEdit={() => setModal(p)}
                  onRemove={() => removePub(p._key)}
                />
              ))}
            </div>}
      </div>

      {!pubOk && publishers.length > 0 && (
        <div className="callout-err" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <X style={{ width: 13, height: 13, flexShrink: 0 }} />
          Publisher shares total {totalPublisher.toFixed(2)}% — must equal 100%.
        </div>
      )}

      {modal && <PublishModal pub={modal} onSave={savePub} onClose={() => setModal(null)} />}
    </div>
  );
}
