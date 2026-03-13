'use client';

import { BarChart3, TrendingUp, Globe, Lock } from 'lucide-react';

const PLATFORMS = [
  { name: 'Spotify',       color: '#1DB954' },
  { name: 'Apple Music',   color: '#FC3C44' },
  { name: 'YouTube Music', color: '#FF0000' },
  { name: 'TikTok',        color: '#69C9D0' },
  { name: 'Deezer',        color: '#A238FF' },
  { name: 'Amazon Music',  color: '#00A8E1' },
];

export default function AnalyticsPage() {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>Track your streams and reach across all platforms</p>
      </div>

      <div className="callout-info" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Lock style={{ width: 14, height: 14, flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>
          Detailed analytics are coming soon. Once your music is distributed, stream counts and revenue data will appear here.
        </span>
      </div>

      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Distribution Platforms</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {PLATFORMS.map(p => (
            <div key={p.name} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>— streams</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {[
          { icon: BarChart3, label: 'Monthly Streams', sub: TrendingUp },
          { icon: Globe, label: 'Top Countries', sub: Globe },
        ].map(({ icon: Icon, label, sub: Sub }) => (
          <div key={label} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
            </div>
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sub style={{ width: 18, height: 18, color: 'var(--text-4)' }} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No data yet</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
