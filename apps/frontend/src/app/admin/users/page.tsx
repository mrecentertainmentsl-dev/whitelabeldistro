'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Search, Loader2, ToggleLeft, ToggleRight, Shield, User, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => api.get(`/api/v1/admin/users?page=${page}&limit=25${search ? `&search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
    keepPreviousData: true,
  });

  const users: any[] = data?.data || [];
  const total: number = data?.total || 0;

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/api/v1/admin/users/${id}`, { isActive: active }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Update failed'),
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{total} total users</p>
        </div>
        <button className="btn-s btn-sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw style={{ width: 13, height: 13 }} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 380 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-3)' }} />
        <input className="inp" style={{ paddingLeft: 32 }} placeholder="Search users…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Releases</th>
              <th>Joined</th>
              <th>Status</th>
              <th style={{ width: 80 }}>Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36 }}>
                <Loader2 style={{ width: 18, height: 18, color: 'var(--text-3)' }} className="animate-spin" />
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--text-3)' }}>No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.isActive ? 'var(--primary-dim)' : 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {u.role?.name === 'admin'
                        ? <Shield style={{ width: 13, height: 13, color: 'var(--warning)' }} />
                        : <User style={{ width: 13, height: 13, color: u.isActive ? 'var(--primary)' : 'var(--text-4)' }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                      {u.firstName} {u.lastName}
                    </span>
                  </div>
                </td>
                <td style={{ fontSize: 12 }}>{u.email}</td>
                <td>
                  <span className={u.role?.name === 'admin' ? 'bdg bdg-yellow' : 'bdg bdg-gray'} style={{ textTransform: 'capitalize' }}>
                    {u.role?.name || 'user'}
                  </span>
                </td>
                <td style={{ fontSize: 12, textAlign: 'center' }}>{u._count?.releases || 0}</td>
                <td style={{ fontSize: 12 }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td>
                  <span className={u.isEmailVerified ? 'bdg bdg-green' : 'bdg bdg-gray'}>
                    {u.isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td>
                  <div
                    className={`toggle ${u.isActive ? 'on' : ''}`}
                    onClick={() => toggle.mutate({ id: u.id, active: !u.isActive })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 25 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-s btn-sm">Prev</button>
              <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="btn-s btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
