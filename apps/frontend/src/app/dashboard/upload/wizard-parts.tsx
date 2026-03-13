'use client';

/**
 * MREC — Professional Release Wizard (8-step)
 * Matches: Identity Music / Revelator / FUGA / Audient metadata depth
 * Supports: B2C (artist) + B2B (label) workflows
 * DDEX ERN 4.3 compatible metadata structure
 */

import {
  useState, useCallback, useRef, useEffect, createContext, useContext,
} from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  ChevronRight, ChevronLeft, Check, Plus, Trash2, X, Upload, Music2,
  AlertCircle, Info, User, Loader2, Globe, Search, ChevronDown,
  Edit2, Save, Image as ImageIcon, Shield, Copy, Star, Disc,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  GENRES, SUBGENRES, LANGUAGES, DISTRIBUTION_PLATFORMS, RELEASE_TYPES,
  ARTIST_ROLES, CONTRIBUTOR_ROLES, PRO_AFFILIATIONS, TERRITORIES,
} from '@mrec/shared/src/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtistCredit {
  _key: string;
  name: string;
  role: string;
  isniCode?: string;
  spotifyId?: string;
  appleId?: string;
  sequenceNo?: number;
}

interface ContributorCredit {
  _key: string;
  name: string;
  role: string;
  ipiNumber?: string;
  proAffiliation?: string;
}

interface PublishingShare {
  _key: string;
  type: 'songwriter' | 'publisher';
  name: string;
  ipiNumber?: string;
  proAffiliation?: string;
  sharePercent: number;
}

interface TrackData {
  _key: string;
  title: string;
  titleVersion: string;
  trackNumber: number;
  discNumber: number;
  isrc: string;
  isExplicit: boolean;
  language: string;
  audioUrl: string;
  audioS3Key: string;
  audioFormat: string;
  durationSeconds: number;
  audioSizeBytes: number;
  uploading: boolean;
  artists: ArtistCredit[];
  contributors: ContributorCredit[];
  publishing: PublishingShare[];
}

interface WizardData {
  // Step 1
  title: string;
  type: string;
  genre: string;
  subgenre: string;
  language: string;
  labelName: string;
  parentalAdvisory: string;
  releaseDate: string;
  originalReleaseDate: string;
  territories: string[];
  upc: string;
  // Step 2
  artists: ArtistCredit[];
  // Step 3
  tracks: TrackData[];
  // Step 4
  contributors: ContributorCredit[];
  // Step 5
  publishing: PublishingShare[];
  // Step 6
  artworkUrl: string;
  artworkS3Key: string;
  artworkWidth: number;
  artworkHeight: number;
  // Step 7
  distributionPlatforms: string[];
  scheduledReleaseTime: string;
  // Step 8
  submissionNotes: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface WizardCtx {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  releaseId: string | null;
  saving: boolean;
  errors: Record<string, string>;
  setErrors: (e: Record<string, string>) => void;
}

const Ctx = createContext<WizardCtx>(null as any);
const useWizard = () => useContext(Ctx);

function mk(): string { return Math.random().toString(36).slice(2, 9); }

const DEFAULT: WizardData = {
  title: '', type: 'single', genre: '', subgenre: '', language: 'English',
  labelName: '', parentalAdvisory: 'none', releaseDate: '', originalReleaseDate: '',
  territories: ['worldwide'], upc: '',
  artists: [{ _key: mk(), name: '', role: 'primary_artist', sequenceNo: 1 }],
  tracks: [],
  contributors: [],
  publishing: [],
  artworkUrl: '', artworkS3Key: '', artworkWidth: 0, artworkHeight: 0,
  distributionPlatforms: ['spotify', 'apple_music', 'youtube_music', 'amazon_music', 'tiktok', 'deezer'],
  scheduledReleaseTime: '',
  submissionNotes: '',
};

// ─── Shared UI Components ─────────────────────────────────────────────────────

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {required && <span style={{ color: 'var(--danger)', fontSize: 11 }}>*</span>}
        {hint && (
          <span title={hint} style={{ color: 'var(--text-4)', cursor: 'help' }}>
            <Info style={{ width: 11, height: 11 }} />
          </span>
        )}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}><AlertCircle style={{ width: 10, height: 10 }} />{error}</p>}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}

function Row3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>{children}</div>;
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{children}</h3>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={onChange}>
      <div style={{
        width: 32, height: 18, borderRadius: 999, flexShrink: 0,
        background: on ? 'var(--primary)' : 'var(--surface-3)',
        border: `1px solid ${on ? 'var(--primary)' : 'var(--border-2)'}`,
        position: 'relative', transition: 'all .15s',
      }}>
        <div style={{ width: 12, height: 12, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: on ? 16 : 2, transition: 'left .15s' }} />
      </div>
      {label && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>}
    </div>
  );
}

// Compact artist/contributor pill
function CreditPill({ name, role, onEdit, onRemove }: {
  name: string; role: string; onEdit: () => void; onRemove: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', background: 'var(--surface-2)',
      border: '1px solid var(--border)', borderRadius: 7,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--surface-3)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <User style={{ width: 13, height: 13, color: 'var(--text-3)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || <span style={{ color: 'var(--text-4)' }}>Unnamed</span>}</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{role}</p>
      </div>
      <button onClick={onEdit} style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 11, color: 'var(--text-2)' }}>Edit</button>
      <button onClick={onRemove} style={{ padding: 4, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-4)' }}>
        <X style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );
}

// ─── Step 1: Release Information ──────────────────────────────────────────────

function Step1() {
  const { data, update, errors } = useWizard();
  const subgenres = SUBGENRES[data.genre] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Basic details that identify this release across all DSPs">
        Release Information
      </SectionTitle>

      <Field label="Release Title" required error={errors.title}>
        <input className="inp" value={data.title} onChange={e => update({ title: e.target.value })}
          placeholder="e.g. Midnight Dreams" autoFocus />
      </Field>

      <Row2>
        <Field label="Release Type" required error={errors.type}>
          <select className="inp" value={data.type} onChange={e => update({ type: e.target.value })}>
            {RELEASE_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Parental Advisory" required>
          <select className="inp" value={data.parentalAdvisory} onChange={e => update({ parentalAdvisory: e.target.value })}>
            <option value="none">Not Explicit</option>
            <option value="explicit">Explicit</option>
            <option value="cleaned">Cleaned / Edited</option>
          </select>
        </Field>
      </Row2>

      <Row3>
        <Field label="Primary Genre" required error={errors.genre}>
          <select className="inp" value={data.genre} onChange={e => update({ genre: e.target.value, subgenre: '' })}>
            <option value="">Select genre…</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Sub-Genre" hint="Optional further classification">
          <select className="inp" value={data.subgenre} onChange={e => update({ subgenre: e.target.value })} disabled={!subgenres.length}>
            <option value="">{subgenres.length ? 'Select sub-genre…' : 'Select genre first'}</option>
            {subgenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Primary Language" required>
          <select className="inp" value={data.language} onChange={e => update({ language: e.target.value })}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </Row3>

      <Row2>
        <Field label="Label Name" hint="Leave blank to use your artist name as label">
          <input className="inp" value={data.labelName} onChange={e => update({ labelName: e.target.value })}
            placeholder="e.g. Indie Records Ltd" />
        </Field>
        <Field label="UPC / EAN" hint="Leave blank to auto-assign">
          <input className="inp" value={data.upc} onChange={e => update({ upc: e.target.value })}
            placeholder="e.g. 5099999785428" style={{ fontFamily: 'DM Mono, monospace' }} />
        </Field>
      </Row2>

      <Row2>
        <Field label="Release Date" required error={errors.releaseDate}
          hint="The date this release goes live on DSPs">
          <input className="inp" type="date" value={data.releaseDate}
            onChange={e => update({ releaseDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]} />
        </Field>
        <Field label="Original Release Date"
          hint="If this is a re-release or remaster — the original first release date">
          <input className="inp" type="date" value={data.originalReleaseDate}
            onChange={e => update({ originalReleaseDate: e.target.value })} />
        </Field>
      </Row2>

      {/* Territory selection */}
      <Field label="Distribution Territories" required>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {data.territories.includes('worldwide')
                ? 'Worldwide distribution selected'
                : `${data.territories.length} territories selected`}
            </span>
            <button
              className="btn-s btn-sm"
              onClick={() => update({ territories: data.territories.includes('worldwide') ? [] : ['worldwide'] })}
              style={{ fontSize: 11 }}>
              {data.territories.includes('worldwide') ? 'Customize territories' : 'Select worldwide'}
            </button>
          </div>
          {!data.territories.includes('worldwide') && (
            <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {TERRITORIES.filter(t => t.id !== 'worldwide').map(t => {
                const sel = data.territories.includes(t.id);
                return (
                  <button key={t.id}
                    onClick={() => update({ territories: sel ? data.territories.filter(x => x !== t.id) : [...data.territories, t.id] })}
                    style={{
                      padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                      background: sel ? 'var(--primary-dim)' : 'var(--surface-2)',
                      border: `1px solid ${sel ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                      color: sel ? 'var(--primary)' : 'var(--text-2)',
                    }}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

// ─── Artist Role Modal ────────────────────────────────────────────────────────

function ArtistModal({ artist, onSave, onClose }: {
  artist: ArtistCredit;
  onSave: (a: ArtistCredit) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...artist });
  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, width: '100%', maxWidth: 480, padding: 24 }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            {artist.name ? 'Edit Artist' : 'Add Artist'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Artist Name" required>
            <input className="inp" value={form.name} onChange={e => up('name', e.target.value)} placeholder="Artist name" autoFocus />
          </Field>
          <Field label="Role" required>
            <select className="inp" value={form.role} onChange={e => up('role', e.target.value)}>
              {ARTIST_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
          <Row2>
            <Field label="ISNI Code" hint="International Standard Name Identifier">
              <input className="inp" value={form.isniCode || ''} onChange={e => up('isniCode', e.target.value)}
                placeholder="e.g. 0000000121256090" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
            </Field>
            <Field label="Spotify Artist ID">
              <input className="inp" value={form.spotifyId || ''} onChange={e => up('spotifyId', e.target.value)}
                placeholder="Spotify URI" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
            </Field>
          </Row2>
          <Field label="Apple Music Artist ID">
            <input className="inp" value={form.appleId || ''} onChange={e => up('appleId', e.target.value)}
              placeholder="Apple Music ID" style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-s" onClick={onClose}>Cancel</button>
          <button className="btn-p" onClick={() => { if (!form.name) return toast.error('Name required'); onSave(form); }}>
            <Check style={{ width: 14, height: 14 }} /> Save Artist
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Artist Roles ─────────────────────────────────────────────────────

function Step2() {
  const { data, update } = useWizard();
  const [modal, setModal] = useState<ArtistCredit | null>(null);

  const addArtist = () => setModal({ _key: mk(), name: '', role: 'featuring', sequenceNo: data.artists.length + 1 });
  const saveArtist = (a: ArtistCredit) => {
    const existing = data.artists.find(x => x._key === a._key);
    if (existing) {
      update({ artists: data.artists.map(x => x._key === a._key ? a : x) });
    } else {
      update({ artists: [...data.artists, a] });
    }
    setModal(null);
  };
  const removeArtist = (_key: string) => update({ artists: data.artists.filter(x => x._key !== _key) });
  const roleLabel = (id: string) => ARTIST_ROLES.find(r => r.id === id)?.label || id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionTitle sub="Define all artists associated with this release. Matches what appears on DSP store pages.">
        Artist Roles
      </SectionTitle>

      <div className="callout-info" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong>Primary Artist</strong> appears in the main billing line. Add <strong>Featuring</strong>, <strong>Remixer</strong> and other roles to create the full credit line. Artist profiles on Spotify and Apple Music will link automatically.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.artists.map((a, i) => (
          <CreditPill key={a._key}
            name={a.name}
            role={`${String(i + 1).padStart(2, '0')} · ${roleLabel(a.role)}`}
            onEdit={() => setModal(a)}
            onRemove={() => removeArtist(a._key)}
          />
        ))}
        <button className="btn-s" onClick={addArtist} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus style={{ width: 13, height: 13 }} /> Add Artist
        </button>
      </div>

      {data.artists.length === 0 && (
        <div className="callout-err" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          At least one Primary Artist is required before submission.
        </div>
      )}

      {modal && <ArtistModal artist={modal} onSave={saveArtist} onClose={() => setModal(null)} />}
    </div>
  );
}

export { Step1, Step2, Field, Row2, Row3, SectionTitle, Toggle, CreditPill, ArtistModal, Ctx, useWizard, mk };
export type { WizardData, ArtistCredit, ContributorCredit, PublishingShare, TrackData };
