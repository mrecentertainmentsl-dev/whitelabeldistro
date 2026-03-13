'use client';

/**
 * MREC Professional Release Wizard — Main Page
 * Orchestrates all 8 steps with autosave and validation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, Check, Save, Send, X,
  Music2, Users, Disc, Mic2, BookOpen, Image as ImageIcon,
  Globe, Eye, Loader2, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Ctx, Step1, Step2, mk } from './wizard-parts';
import type { WizardData } from './wizard-parts';
import { Step3, Step4, Step5 } from './wizard-steps-3-5';
import { Step6, Step7, Step8 } from './wizard-steps-6-8';

// ─── Step configuration ───────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Release Info',   short: 'Info',        icon: Music2,     component: Step1 },
  { id: 2, label: 'Artist Roles',   short: 'Artists',     icon: Users,      component: Step2 },
  { id: 3, label: 'Tracklist',      short: 'Tracks',      icon: Disc,       component: Step3 },
  { id: 4, label: 'Contributors',   short: 'Credits',     icon: Mic2,       component: Step4 },
  { id: 5, label: 'Publishing',     short: 'Publishing',  icon: BookOpen,   component: Step5 },
  { id: 6, label: 'Artwork',        short: 'Artwork',     icon: ImageIcon,  component: Step6 },
  { id: 7, label: 'Distribution',   short: 'Platforms',   icon: Globe,      component: Step7 },
  { id: 8, label: 'Review',         short: 'Review',      icon: Eye,        component: Step8 },
] as const;

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

// ─── Validation per step ──────────────────────────────────────────────────────

function validate(step: number, data: WizardData): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!data.title.trim()) e.title = 'Required';
    if (!data.genre) e.genre = 'Required';
    if (!data.releaseDate) e.releaseDate = 'Required';
  }
  if (step === 2) {
    const hasPrimary = data.artists.some(a => a.role === 'primary_artist' && a.name.trim());
    if (!hasPrimary) e.artists = 'At least one primary artist is required';
  }
  if (step === 3) {
    if (data.tracks.length === 0) e.tracks = 'Add at least one track';
    else if (data.tracks.some(t => !t.title.trim())) e.tracks = 'All tracks must have a title';
    else if (data.tracks.some(t => !t.audioUrl)) e.tracks = 'All tracks must have an audio file uploaded';
  }
  if (step === 6) {
    if (!data.artworkUrl) e.artwork = 'Cover artwork is required';
  }
  if (step === 7) {
    if (data.distributionPlatforms.length === 0) e.platforms = 'Select at least one platform';
  }
  return e;
}

// ─── Progress indicator ───────────────────────────────────────────────────────

function StepDot({ step, current, label, done }: {
  step: number; current: number; label: string; done: boolean;
}) {
  const active = step === current;
  const past = step < current;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 52, flex: 1 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'all .2s',
        background: done ? 'var(--primary)' : active ? 'var(--surface-2)' : 'var(--surface)',
        border: `2px solid ${done ? 'var(--primary)' : active ? 'var(--primary)' : 'var(--border-2)'}`,
      }}>
        {done
          ? <Check style={{ width: 13, height: 13, color: '#000' }} />
          : <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--primary)' : 'var(--text-4)' }}>{step}</span>}
      </div>
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-3)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function ReleasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      // Debounce autosave
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => autosave(next), 2000);
      return next;
    });
    setErrors({});
  }, []);

  // ── Autosave ─────────────────────────────────────────────────────────────

  const autosave = useCallback(async (d: WizardData) => {
    try {
      setSaving(true);
      const payload = buildPayload(d);
      if (releaseId) {
        await api.patch(`/api/v1/releases/${releaseId}`, { ...payload, wizardStep: step, wizardDraft: d });
      } else {
        // Only create if we have a title
        if (!d.title.trim()) return;
        const res = await api.post('/api/v1/releases', { ...payload, wizardStep: step, wizardDraft: d });
        setReleaseId(res.data.id);
      }
      setLastSaved(new Date());
    } catch {
      // Silent fail on autosave
    } finally {
      setSaving(false);
    }
  }, [releaseId, step]);

  // ── Build API payload ─────────────────────────────────────────────────────

  function buildPayload(d: WizardData) {
    const primaryArtist = d.artists.find(a => a.role === 'primary_artist');
    return {
      title: d.title,
      type: d.type,
      genre: d.genre,
      subgenre: d.subgenre,
      language: d.language,
      labelName: d.labelName,
      parentalAdvisory: d.parentalAdvisory,
      releaseDate: d.releaseDate || null,
      originalReleaseDate: d.originalReleaseDate || null,
      territories: d.territories,
      upc: d.upc,
      artworkUrl: d.artworkUrl,
      artworkS3Key: d.artworkS3Key,
      artworkWidth: d.artworkWidth,
      artworkHeight: d.artworkHeight,
      distributionPlatforms: d.distributionPlatforms,
      scheduledReleaseTime: d.scheduledReleaseTime,
      submissionNotes: d.submissionNotes,
      artistCredits: d.artists,
      contributorCredits: d.contributors,
      publishingShares: d.publishing,
      songs: d.tracks.map((t, i) => ({
        id: (t as any).id,
        title: t.title,
        titleVersion: t.titleVersion,
        trackNumber: t.trackNumber,
        discNumber: t.discNumber,
        isrc: t.isrc,
        isExplicit: t.isExplicit,
        language: t.language,
        audioUrl: t.audioUrl,
        audioS3Key: t.audioS3Key,
        audioFormat: t.audioFormat,
        durationSeconds: t.durationSeconds,
        audioSizeBytes: t.audioSizeBytes,
        artistName: primaryArtist?.name || '',
        artistCredits: t.artists,
        contributorCredits: t.contributors,
        publishingShares: t.publishing,
      })),
    };
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  const goNext = async () => {
    const errs = validate(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the issues before continuing');
      return;
    }
    setErrors({});
    if (step < 8) {
      await autosave(data);
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    setErrors({});
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpTo = (s: number) => {
    if (s < step) { setErrors({}); setStep(s); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Full validation
    const allIssues: string[] = [];
    if (!data.title) allIssues.push('Release title');
    if (!data.genre) allIssues.push('Genre');
    if (!data.releaseDate) allIssues.push('Release date');
    if (!data.artists.some(a => a.role === 'primary_artist' && a.name)) allIssues.push('Primary artist');
    if (data.tracks.length === 0) allIssues.push('Tracks');
    if (data.tracks.some(t => !t.audioUrl)) allIssues.push('Audio files');
    if (!data.artworkUrl) allIssues.push('Cover artwork');
    if (data.distributionPlatforms.length === 0) allIssues.push('Distribution platforms');

    if (allIssues.length > 0) {
      toast.error(`Missing: ${allIssues.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      // Final save
      const payload = buildPayload(data);
      let rId = releaseId;
      if (rId) {
        await api.patch(`/api/v1/releases/${rId}`, { ...payload, wizardStep: 8 });
      } else {
        const res = await api.post('/api/v1/releases', payload);
        rId = res.data.id;
        setReleaseId(rId);
      }
      // Submit for review
      await api.post(`/api/v1/releases/${rId}/submit`, { submissionNotes: data.submissionNotes });
      toast.success('Release submitted for QC review!');
      router.push('/dashboard/releases');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('Discard this release? All unsaved data will be lost.')) {
      router.push('/dashboard/releases');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const StepComponent = STEPS[step - 1].component;

  return (
    <Ctx.Provider value={{ data, update, releaseId, saving, errors, setErrors }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* ── Top bar ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '0 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleDiscard} className="btn-g btn-sm">
                <X style={{ width: 13, height: 13 }} /> Discard
              </button>
              <div style={{ height: 18, width: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {data.title || 'New Release'}
              </span>
              {data.type && (
                <span className="bdg bdg-gray" style={{ textTransform: 'capitalize' }}>{data.type}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {lastSaved && (
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                  {saving ? 'Saving…' : `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              )}
              {saving && <Loader2 style={{ width: 13, height: 13, color: 'var(--text-4)' }} className="animate-spin" />}
              <button className="btn-s btn-sm" onClick={() => autosave(data)} disabled={saving}>
                <Save style={{ width: 13, height: 13 }} /> Save Draft
              </button>
            </div>
          </div>

          {/* Step progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 12, gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <button
                  onClick={() => jumpTo(s.id)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: s.id < step ? 'pointer' : 'default', flex: 1 }}>
                  <StepDot
                    step={s.id}
                    current={step}
                    label={s.short}
                    done={s.id < step}
                  />
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ height: 1, flex: 1, background: s.id < step ? 'var(--primary)' : 'var(--border-2)', margin: '0 2px', marginBottom: 18 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, padding: '28px 0' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 28px' }}>
            {/* Step header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>
                  Step {step} of {STEPS.length}
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {STEPS[step - 1].label}
              </h2>
            </div>

            {/* Step content */}
            <div className="fade-in" key={step}>
              <StepComponent />
            </div>

            {/* Inline errors */}
            {Object.keys(errors).length > 0 && (
              <div className="callout-err" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                {Object.values(errors)[0]}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom navigation ── */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'var(--bg)', borderTop: '1px solid var(--border)',
          padding: '12px 28px',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left — back */}
            <button
              className="btn-s"
              onClick={goPrev}
              disabled={step === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft style={{ width: 15, height: 15 }} /> Back
            </button>

            {/* Centre — release info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {data.artworkUrl && (
                <img src={data.artworkUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{data.title || 'Untitled Release'}</p>
                {data.tracks.length > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{data.tracks.length} track{data.tracks.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            {/* Right — next / submit */}
            {step < 8 ? (
              <button className="btn-p" onClick={goNext} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Continue <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            ) : (
              <button
                className="btn-p"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px' }}>
                {submitting
                  ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                  : <Send style={{ width: 14, height: 14 }} />}
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
