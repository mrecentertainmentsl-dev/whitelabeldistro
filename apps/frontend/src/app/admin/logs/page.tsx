'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const ACTION_COLOR: Record<string, string> = {
  approve: 'var(--success)', reject: 'var(--danger)', delete: 'var(--danger)',
  edit: 'var(--info)', create: 'var(--primary)', toggle: 'var(--warning)',
};
function actionColor(action: string) {
  for (const [k, v] of Object.entries(ACTION_COLOR)) {
    if (action.toLowerCase().includes(k)) return v;
  }
  return 'var(--text-3)';
}

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: () => api.get(`/api/v1/admin/logs?page=${page}&limit=40`).then(r => r.data),
    refetchInterval: 30_000,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Audit Logs</h1>
        <button className="btn-s btn-sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw style={{ width: 13, height: 13 }} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Admin</th>
              <th>Entity</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                <Loader2 style={{ width: 18, height: 18, color: 'var(--text-3)' }} className="animate-spin" />
              </td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 13 }}>No logs yet</td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id}>
                <td style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                  {format(new Date(log.createdAt), 'MMM d HH:mm:ss')}
                </td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 500, color: actionColor(log.action) }}>{log.action}</span>
                </td>
                <td style={{ fontSize: 12 }}>{log.user?.email || '—'}</td>
                <td style={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                  {log.entityType ? `${log.entityType} ${log.entityId?.slice(0, 8)}` : '—'}
                </td>
                <td style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)' }}>
                  {log.ipAddress || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 40 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{(page-1)*40+1}–{Math.min(page*40, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-s btn-sm">Prev</button>
              <button disabled={page * 40 >= total} onClick={() => setPage(p => p + 1)} className="btn-s btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
