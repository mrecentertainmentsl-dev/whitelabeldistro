'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { Save, Upload, Loader2, Globe, Plus } from 'lucide-react';
import { api } from '@/lib/api';

type SideTab = 'workspace' | 'branding' | 'teams' | 'payout' | 'integration' | 'templates';
type BrandTab = 'visual' | 'website' | 'emails' | 'legal';

/* ── Logo upload box exactly like screenshots ── */
function LogoBox({ label, url, hint, onUrl }: { label: string; url?: string; hint?: string; onUrl: (u: string) => void }) {
  const [loading, setLoading] = useState(false);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/svg+xml': ['.svg'], 'image/x-icon': ['.ico'], 'image/webp': ['.webp'] },
    maxFiles: 1, maxSize: 5 * 1024 * 1024,
    onDrop: async (files) => {
      const file = files[0]; if (!file) return; setLoading(true);
      try {
        const { data: p } = await api.post('/api/v1/uploads/presign', { filename: file.name, contentType: file.type, uploadType: 'logo' });
        await fetch(p.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        onUrl(p.publicUrl); toast.success(`${label} uploaded`);
      } catch { toast.error('Upload failed'); } finally { setLoading(false); }
    },
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      <div {...getRootProps()} className="logo-box">
        <input {...getInputProps()} />
        <div className="logo-trigger">
          {loading ? <Loader2 style={{ width: 14, height: 14, color: 'var(--text-3)' }} className="animate-spin" /> : <Upload style={{ width: 14, height: 14, color: 'var(--text-3)' }} />}
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
        </div>
        <div className="logo-preview">
          {url ? <img src={url} alt={label} style={{ maxHeight: 28, maxWidth: 60, objectFit: 'contain' }} />
               : <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe style={{ width: 14, height: 14, color: 'var(--text-4)' }} /></div>}
        </div>
      </div>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</p>}
    </div>
  );
}

/* ── Color input ── */
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border-2)', overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', padding: 2 }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }} />
        </div>
        <input className="inp" value={value} onChange={e => onChange(e.target.value)} style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Sec({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: desc ? 2 : 0 }}>{title}</h3>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</p>}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

/* ── Toggle ── */
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      width: 32, height: 18, borderRadius: 999, background: on ? 'var(--primary)' : 'var(--surface-3)',
      border: `1px solid ${on ? 'var(--primary)' : 'var(--border-2)'}`, position: 'relative', cursor: 'pointer',
      transition: 'all .18s', flexShrink: 0,
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 16 : 2, transition: 'left .18s',
      }} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [side, setSide] = useState<SideTab>('branding');
  const [bt, setBt] = useState<BrandTab>('visual');
  const qc = useQueryClient();

  const { data: bl } = useQuery({ queryKey: ['admin-branding'], queryFn: () => api.get('/api/v1/branding').then(r => r.data) });
  const br = bl?.[0] || {};

  const { data: sarr } = useQuery({ queryKey: ['admin-settings'], queryFn: () => api.get('/api/v1/settings').then(r => r.data) });
  const sm: Record<string, string> = {};
  if (Array.isArray(sarr)) sarr.forEach((s: any) => { sm[s.key] = s.value; });

  const [b, setB] = useState({
    platformName: br?.platformName || 'MREC Entertainment',
    tagline: br?.tagline || '',
    primaryColor: br?.primaryColor || '#22c55e',
    secondaryColor: br?.secondaryColor || '#16a34a',
    accentColor: br?.accentColor || '#f59e0b',
    backgroundColor: br?.backgroundColor || '#0d0d0d',
    textColor: br?.textColor || '#eeeeee',
    supportEmail: br?.supportEmail || '',
    supportUrl: br?.supportUrl || '',
    termsUrl: br?.termsUrl || '',
    privacyUrl: br?.privacyUrl || '',
    footerText: br?.footerText || '',
    customCss: br?.customCss || '',
    emailLogoUrl: br?.emailLogoUrl || '',
    emailHeaderColor: br?.emailHeaderColor || '#22c55e',
    emailFooterText: br?.emailFooterText || '',
    faviconLightUrl: br?.faviconLightUrl || '',
    faviconDarkUrl: br?.faviconDarkUrl || '',
    squareLogoLightUrl: br?.squareLogoLightUrl || '',
    squareLogoDarkUrl: br?.squareLogoDarkUrl || '',
    horizontalLogoLightUrl: br?.horizontalLogoLightUrl || '',
    horizontalLogoDarkUrl: br?.horizontalLogoDarkUrl || '',
    loginBgUrl: br?.loginBgUrl || '',
  });

  const [s3, setS3] = useState({ aws_access_key_id: '', aws_secret_access_key: '', aws_s3_bucket: sm['aws_s3_bucket'] || '', aws_s3_region: sm['aws_s3_region'] || 'us-east-1' });
  const [ses, setSes] = useState({ aws_ses_region: sm['aws_ses_region'] || 'us-east-1', aws_ses_from_email: sm['aws_ses_from_email'] || '', aws_ses_from_name: sm['aws_ses_from_name'] || '' });
  const [dist, setDist] = useState({ require_isrc: sm['require_isrc'] || 'false', auto_approve: sm['auto_approve'] || 'false', max_file_size_mb: sm['max_file_size_mb'] || '500' });
  const [ddex, setDdex] = useState({ ddex_sender_dpid: sm['ddex_sender_dpid'] || '', ddex_sender_name: sm['ddex_sender_name'] || '', ddex_ern_version: sm['ddex_ern_version'] || '4.3', ddex_delivery: sm['ddex_delivery'] || 'sftp' });

  const updB = useMutation({ mutationFn: (d: any) => api.put('/api/v1/branding/default/update', d), onSuccess: () => { toast.success('Branding saved'); qc.invalidateQueries({ queryKey: ['admin-branding'] }); }, onError: () => toast.error('Failed') });
  const updS = useMutation({ mutationFn: (d: Record<string, string>) => api.put('/api/v1/settings', d), onSuccess: () => toast.success('Settings saved'), onError: () => toast.error('Failed') });

  const BF = (k: keyof typeof b) => (v: string) => setB(p => ({ ...p, [k]: v }));

  const sideItems: { id: SideTab; label: string }[] = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'branding', label: 'Branding' },
    { id: 'teams', label: 'Teams' },
    { id: 'payout', label: 'Payout Info' },
    { id: 'integration', label: 'Integration' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: '100%' }} className="fade-in">
      {/* Left nav */}
      <div style={{ width: 176, flexShrink: 0, paddingRight: 24 }}>
        {sideItems.map(({ id, label }) => (
          <button key={id} onClick={() => setSide(id)} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 5,
            fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all .12s', marginBottom: 1,
            background: side === id ? 'var(--surface-2)' : 'transparent',
            color: side === id ? 'var(--text)' : 'var(--text-2)',
          }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* ─── BRANDING ─── */}
        {side === 'branding' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>Branding</h1>
            {/* Sub-tabs */}
            <div className="tabs" style={{ marginBottom: 28 }}>
              {[['visual', 'Visual Identity'], ['website', 'Website Content'], ['emails', 'Emails'], ['legal', 'Legal']].map(([id, label]) => (
                <button key={id} className={`tab ${bt === id ? 'on' : ''}`} onClick={() => setBt(id as BrandTab)}>{label}</button>
              ))}
            </div>

            {/* Visual Identity */}
            {bt === 'visual' && <>
              <Sec title="Logos and Favicon" desc="Upload your brand logos and favicon">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Light Theme</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>When the theme is light mode</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <LogoBox label="Favicon" url={b.faviconLightUrl} hint=".ico or .png — 32×32px" onUrl={v => setB(p => ({ ...p, faviconLightUrl: v }))} />
                      <LogoBox label="Square Logo" url={b.squareLogoLightUrl} hint="512×512px min" onUrl={v => setB(p => ({ ...p, squareLogoLightUrl: v }))} />
                      <LogoBox label="Horizontal Logo" url={b.horizontalLogoLightUrl} hint="e.g. 400×100px" onUrl={v => setB(p => ({ ...p, horizontalLogoLightUrl: v }))} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Dark Theme</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>When the theme is dark mode</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <LogoBox label="Favicon" url={b.faviconDarkUrl} hint=".ico or .png — 32×32px" onUrl={v => setB(p => ({ ...p, faviconDarkUrl: v }))} />
                      <LogoBox label="Square Logo" url={b.squareLogoDarkUrl} hint="512×512px min" onUrl={v => setB(p => ({ ...p, squareLogoDarkUrl: v }))} />
                      <LogoBox label="Horizontal Logo" url={b.horizontalLogoDarkUrl} hint="e.g. 400×100px" onUrl={v => setB(p => ({ ...p, horizontalLogoDarkUrl: v }))} />
                    </div>
                  </div>
                </div>
              </Sec>
              <Sec title="Login Background" desc="Background image for the login page">
                <LogoBox label="Background Image" url={b.loginBgUrl} hint="1920×1080px recommended — JPG or PNG" onUrl={v => setB(p => ({ ...p, loginBgUrl: v }))} />
              </Sec>
              <Sec title="Platform Identity">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Platform Name</label>
                    <input className="inp" value={b.platformName} onChange={e => setB(p => ({ ...p, platformName: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Tagline</label>
                    <input className="inp" value={b.tagline} placeholder="Distribute Your Music Globally" onChange={e => setB(p => ({ ...p, tagline: e.target.value }))} />
                  </div>
                </div>
              </Sec>
              <Sec title="Brand Colors">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
                  <ColorInput label="Primary" value={b.primaryColor} onChange={BF('primaryColor')} />
                  <ColorInput label="Secondary" value={b.secondaryColor} onChange={BF('secondaryColor')} />
                  <ColorInput label="Accent" value={b.accentColor} onChange={BF('accentColor')} />
                  <ColorInput label="Background" value={b.backgroundColor} onChange={BF('backgroundColor')} />
                  <ColorInput label="Text" value={b.textColor} onChange={BF('textColor')} />
                </div>
                {/* Live preview */}
                <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: b.backgroundColor }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {b.horizontalLogoDarkUrl
                      ? <img src={b.horizontalLogoDarkUrl} alt="Logo" style={{ height: 24, objectFit: 'contain' }} />
                      : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 4, background: b.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>{b.platformName?.[0] || 'M'}</span>
                          </div>
                          <span style={{ color: b.textColor, fontWeight: 600, fontSize: 14 }}>{b.platformName}</span>
                        </div>}
                  </div>
                  {b.tagline && <p style={{ color: b.textColor, fontSize: 12, opacity: 0.5, marginBottom: 12 }}>{b.tagline}</p>}
                  <button style={{ background: b.primaryColor, color: '#000', border: 'none', borderRadius: 4, padding: '6px 14px', fontSize: 12, fontWeight: 500 }}>Preview Button</button>
                </div>
              </Sec>
              <Sec title="Custom CSS" desc="Inject additional styles into the platform">
                <textarea className="inp" rows={6} value={b.customCss} placeholder="/* Custom CSS */"
                          style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}
                          onChange={e => setB(p => ({ ...p, customCss: e.target.value }))} />
              </Sec>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-p" onClick={() => updB.mutate(b)} disabled={updB.isPending}>
                  {updB.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                  Save Visual Identity
                </button>
              </div>
            </>}

            {/* Website Content */}
            {bt === 'website' && <>
              <Sec title="Support & Contact">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[['supportEmail', 'Support Email', 'support@yourplatform.com', 'email'], ['supportUrl', 'Support URL', 'https://help.yourplatform.com', 'url']].map(([k, label, ph, t]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
                      <input className="inp" type={t} placeholder={ph} value={(b as any)[k]} onChange={e => setB(p => ({ ...p, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </Sec>
              <Sec title="Footer">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Footer Text</label>
                  <input className="inp" value={b.footerText} placeholder="© 2025 Your Platform. All rights reserved." onChange={e => setB(p => ({ ...p, footerText: e.target.value }))} />
                </div>
              </Sec>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-p" onClick={() => updB.mutate(b)} disabled={updB.isPending}><Save style={{ width: 14, height: 14 }} />Save</button>
              </div>
            </>}

            {/* Emails */}
            {bt === 'emails' && <>
              <Sec title="Email Branding">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <LogoBox label="Email Logo" url={b.emailLogoUrl} hint="300×80px recommended — PNG transparent bg" onUrl={v => setB(p => ({ ...p, emailLogoUrl: v }))} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <ColorInput label="Email Header Color" value={b.emailHeaderColor} onChange={BF('emailHeaderColor')} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email Footer Text</label>
                    <input className="inp" value={b.emailFooterText} placeholder="© 2025 Your Platform" onChange={e => setB(p => ({ ...p, emailFooterText: e.target.value }))} />
                  </div>
                </div>
              </Sec>
              <Sec title="Email Delivery (AWS SES)">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>SES Region</label>
                    <select className="inp" value={ses.aws_ses_region} onChange={e => setSes(p => ({ ...p, aws_ses_region: e.target.value }))}>
                      {['us-east-1','us-west-2','eu-west-1','eu-central-1','ap-southeast-1'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>From Email</label>
                    <input className="inp" type="email" placeholder="noreply@yourplatform.com" value={ses.aws_ses_from_email} onChange={e => setSes(p => ({ ...p, aws_ses_from_email: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>From Name</label>
                    <input className="inp" placeholder="Your Platform" value={ses.aws_ses_from_name} onChange={e => setSes(p => ({ ...p, aws_ses_from_name: e.target.value }))} />
                  </div>
                </div>
              </Sec>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-s" onClick={() => updS.mutate(ses)} disabled={updS.isPending}>Save SES Config</button>
                <button className="btn-p" onClick={() => updB.mutate(b)} disabled={updB.isPending}><Save style={{ width: 14, height: 14 }} />Save Email Branding</button>
              </div>
            </>}

            {/* Legal */}
            {bt === 'legal' && <>
              <Sec title="Legal Pages">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Terms of Service URL</label>
                    <input className="inp" type="url" value={b.termsUrl} placeholder="https://yourplatform.com/terms" onChange={e => setB(p => ({ ...p, termsUrl: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Privacy Policy URL</label>
                    <input className="inp" type="url" value={b.privacyUrl} placeholder="https://yourplatform.com/privacy" onChange={e => setB(p => ({ ...p, privacyUrl: e.target.value }))} />
                  </div>
                </div>
              </Sec>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-p" onClick={() => updB.mutate(b)} disabled={updB.isPending}><Save style={{ width: 14, height: 14 }} />Save Legal Links</button>
              </div>
            </>}
          </div>
        )}

        {/* ─── WORKSPACE ─── */}
        {side === 'workspace' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>Workspace</h1>
            <Sec title="AWS S3 Storage" desc="File storage — credentials stored encrypted">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[['aws_access_key_id', 'Access Key ID', 'AKIA••••••••', true], ['aws_secret_access_key', 'Secret Access Key', '••••••••', true], ['aws_s3_bucket', 'Bucket Name', 'my-platform-files', false]].map(([k, label, ph, pwd]) => (
                  <div key={k as string} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label as string}</label>
                    <input className="inp" type={pwd ? 'password' : 'text'} placeholder={ph as string}
                           value={(s3 as any)[k as string]} onChange={e => setS3(p => ({ ...p, [k as string]: e.target.value }))} style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Region</label>
                  <select className="inp" value={s3.aws_s3_region} onChange={e => setS3(p => ({ ...p, aws_s3_region: e.target.value }))}>
                    {['us-east-1','us-west-2','eu-west-1','eu-central-1','ap-southeast-1','ap-northeast-1'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </Sec>
            <Sec title="Distribution Defaults">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { k: 'require_isrc', label: 'Require ISRC', desc: 'Artists must provide ISRC codes before submitting' },
                  { k: 'auto_approve', label: 'Auto-approve releases', desc: 'Skip manual QC — not recommended for production' },
                ].map(({ k, label, desc }) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{desc}</p>
                    </div>
                    <Toggle on={dist[k as keyof typeof dist] === 'true'}
                            onClick={() => setDist(p => ({ ...p, [k]: p[k as keyof typeof p] === 'true' ? 'false' : 'true' }))} />
                  </div>
                ))}
              </div>
            </Sec>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-p" onClick={() => { updS.mutate({ ...s3, ...dist }); }} disabled={updS.isPending}>
                {updS.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                Save Workspace
              </button>
            </div>
          </div>
        )}

        {/* ─── INTEGRATION / DDEX ─── */}
        {side === 'integration' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>Integration</h1>
            <Sec title="DDEX ERN 4.3" desc="Standards-compliant Electronic Release Notification packages for distribution partners">
              <div style={{ padding: '10px 14px', background: 'var(--info-dim)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 20, fontSize: 12, color: '#93c5fd', lineHeight: 1.6 }}>
                The platform generates DDEX ERN 4.3 XML packages for all approved releases. Supported message types: <strong>NewReleaseMessage</strong>, <strong>PurgeReleaseMessage</strong>, <strong>TakedownMessage</strong>, <strong>UpdateReleaseMessage</strong>.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[['ddex_sender_dpid', 'Sender Party ID (DPID)', 'PADPIDA2000001001O'], ['ddex_sender_name', 'Sender Name', 'MREC Entertainment']].map(([k, label, ph]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
                    <input className="inp" placeholder={ph} value={(ddex as any)[k]} onChange={e => setDdex(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>ERN Version</label>
                  <select className="inp" value={ddex.ddex_ern_version} onChange={e => setDdex(p => ({ ...p, ddex_ern_version: e.target.value }))}>
                    <option value="4.3">ERN 4.3 (current)</option>
                    <option value="4.2">ERN 4.2</option>
                    <option value="4.1">ERN 4.1</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Delivery Channel</label>
                  <select className="inp" value={ddex.ddex_delivery} onChange={e => setDdex(p => ({ ...p, ddex_delivery: e.target.value }))}>
                    <option value="sftp">SFTP</option>
                    <option value="s3">Amazon S3</option>
                    <option value="webhook">Webhook (POST)</option>
                  </select>
                </div>
              </div>
            </Sec>
            <Sec title="Custom Domain" desc="Map a custom domain — point CNAME to platform.mrec.io">
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="inp" placeholder="music.yourdomain.com" />
                <button className="btn-p btn-sm" style={{ flexShrink: 0 }}>Add Domain</button>
              </div>
            </Sec>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-p" onClick={() => updS.mutate(ddex)} disabled={updS.isPending}><Save style={{ width: 14, height: 14 }} />Save Integration</button>
            </div>
          </div>
        )}

        {/* ─── TEMPLATES ─── */}
        {side === 'templates' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>Templates</h1>
            <Sec title="Email Templates">
              <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {['Welcome Email','Email Verification','Password Reset','Release Submitted','Release Approved','Release Rejected','Release Distributed'].map((t, i) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: i % 2 ? 'transparent' : 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t}</span>
                    <button className="btn-s btn-sm">Edit</button>
                  </div>
                ))}
              </div>
            </Sec>
          </div>
        )}

        {/* ─── TEAMS ─── */}
        {side === 'teams' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>Teams</h1>
            <Sec title="Admin Users" desc="Manage who has access to the admin panel">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button className="btn-p btn-sm"><Plus style={{ width: 13, height: 13 }} />Invite Admin</button>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--info-dim)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: '#93c5fd' }}>
                Invite additional admin users to help with QC, release approvals and platform management.
              </div>
            </Sec>
          </div>
        )}

        {/* ─── PAYOUT ─── */}
        {side === 'payout' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.02em' }}>Payout Info</h1>
            <Sec title="Royalty Payout Configuration">
              <div style={{ padding: '10px 14px', background: 'var(--warning-dim)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#fcd34d' }}>
                Connect a payment processor (Stripe Connect, Tipalti, etc.) to enable royalty payouts to artists. Configuration coming soon.
              </div>
            </Sec>
          </div>
        )}

      </div>
    </div>
  );
}
