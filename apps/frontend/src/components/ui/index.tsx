'use client';

// Shared UI primitives using the new design system CSS vars

import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Loading spinner ── */
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 style={{ width: size, height: size, color: 'var(--text-3)' }} className="animate-spin" />;
}

/* ── Empty state ── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {Icon && (
        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon style={{ width: 22, height: 22, color: 'var(--text-4)' }} />
        </div>
      )}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: action ? 20 : 0, maxWidth: 320, margin: '0 auto', lineHeight: 1.5 }}>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

/* ── Pagination ── */
export function Pagination({
  page,
  total,
  pageSize = 20,
  onChange,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="btn-s btn-sm"
          style={{ padding: '4px 8px' }}
        >
          <ChevronLeft style={{ width: 13, height: 13 }} />
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page - 2 + i;
          if (p < 1 || p > pages) return null;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={page === p ? 'btn-p btn-sm' : 'btn-s btn-sm'}
              style={{ padding: '4px 10px', minWidth: 32 }}
            >
              {p}
            </button>
          );
        })}
        <button
          disabled={page * pageSize >= total}
          onClick={() => onChange(page + 1)}
          className="btn-s btn-sm"
          style={{ padding: '4px 8px' }}
        >
          <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}

/* ── Page header ── */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</h1>
        {description && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>{description}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ── Stat card ── */
export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'var(--primary)',
  sub,
}: {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
        {Icon && (
          <div style={{ width: 30, height: 30, borderRadius: 6, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 14, height: 14, color }} />
          </div>
        )}
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>{value ?? 0}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}
