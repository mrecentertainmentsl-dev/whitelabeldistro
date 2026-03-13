import Link from 'next/link';
import { Music2, Globe, Shield, Zap, ArrowRight, Check } from 'lucide-react';

const PLATFORMS = ['Spotify', 'Apple Music', 'YouTube Music', 'TikTok', 'Deezer', 'Amazon Music', 'Tidal', 'Pandora', 'SoundCloud'];

const FEATURES = [
  { icon: Globe, title: 'Global Distribution', desc: 'Reach 150+ streaming platforms and digital stores worldwide in a single submission.' },
  { icon: Shield, title: 'DDEX ERN 4.3 Compliant', desc: 'Standards-compliant XML package generation for all approved releases.' },
  { icon: Zap, title: 'Fast QC Review', desc: 'Automated quality checks with manual admin review before distribution.' },
  { icon: Music2, title: 'Full Metadata Control', desc: 'ISRC codes, contributor credits, split sheets — everything a professional release needs.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music2 style={{ width: 14, height: 14, color: '#000' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>MREC Entertainment</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" style={{ padding: '7px 14px', borderRadius: 5, fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
            Sign in
          </Link>
          <Link href="/auth/register" style={{ padding: '7px 14px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: 'var(--primary)', color: '#000', textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '96px 24px 80px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'var(--primary-dim)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
          <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>DDEX ERN 4.3 compatible</span>
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Distribute Your Music<br />
          <span style={{ color: 'var(--primary)' }}>Globally</span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Professional music distribution platform for artists and labels. Upload, distribute, and track your releases across 150+ platforms worldwide.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/auth/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            background: 'var(--primary)', color: '#000', borderRadius: 6, textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
          }}>
            Start Distributing <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
          <Link href="/auth/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Platform logos */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 48px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-4)', marginRight: 8 }}>Distribute to</span>
          {PLATFORMS.map(p => (
            <span key={p} style={{ fontSize: 12, color: 'var(--text-3)', padding: '3px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>{p}</span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>+ 140 more</span>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', textAlign: 'center', letterSpacing: '-0.02em', marginBottom: 48 }}>
          Everything you need to distribute
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon style={{ width: 18, height: 18, color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Ready to distribute?</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>Create your free account and upload your first release in minutes.</p>
        <Link href="/auth/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px',
          background: 'var(--primary)', color: '#000', borderRadius: 6, textDecoration: 'none',
          fontSize: 14, fontWeight: 600,
        }}>
          Get Started Free <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-4)' }}>© 2025 MREC Entertainment. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="#" style={{ fontSize: 12, color: 'var(--text-4)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="#" style={{ fontSize: 12, color: 'var(--text-4)', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>
    </div>
  );
}
