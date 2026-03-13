// hooks/index.ts — Custom React hooks for the platform

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

// ─── Releases ─────────────────────────────────────────────────────────────────
export function useReleases(params: { page?: number; status?: string; limit?: number } = {}) {
  const { page = 1, status = 'all', limit = 12 } = params;
  return useQuery({
    queryKey: ['releases', page, status, limit],
    queryFn: () =>
      api.get(`/api/v1/releases?page=${page}&limit=${limit}${status !== 'all' ? `&status=${status}` : ''}`).then(r => r.data),
  });
}

export function useRelease(id: string | null) {
  return useQuery({
    queryKey: ['release', id],
    queryFn: () => api.get(`/api/v1/releases/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useReleaseStats() {
  return useQuery({
    queryKey: ['release-stats'],
    queryFn: () => api.get('/api/v1/releases/stats').then(r => r.data),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/api/v1/admin/overview').then(r => r.data),
    refetchInterval: 30_000,
  });
}

export function useAdminUsers(params: { page?: number; search?: string; role?: string } = {}) {
  const { page = 1, search = '', role = '' } = params;
  return useQuery({
    queryKey: ['admin-users', page, search, role],
    queryFn: () =>
      api.get(`/api/v1/admin/users?page=${page}&limit=20${search ? `&search=${search}` : ''}${role ? `&role=${role}` : ''}`).then(r => r.data),
  });
}

export function useAdminReleases(params: { page?: number; status?: string; search?: string } = {}) {
  const { page = 1, status = 'all', search = '' } = params;
  return useQuery({
    queryKey: ['admin-releases', page, status, search],
    queryFn: () =>
      api.get(`/api/v1/admin/releases?page=${page}&limit=20${status !== 'all' ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`).then(r => r.data),
  });
}

export function useAdminLogs(page = 1) {
  return useQuery({
    queryKey: ['admin-logs', page],
    queryFn: () => api.get(`/api/v1/admin/logs?page=${page}&limit=50`).then(r => r.data),
    refetchInterval: 30_000,
  });
}

// ─── Branding ─────────────────────────────────────────────────────────────────
export function useBrandingConfig() {
  return useQuery({
    queryKey: ['admin-branding'],
    queryFn: () => api.get('/api/v1/branding').then(r => r.data[0] || {}),
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => api.put('/api/v1/branding/default/update', dto),
    onSuccess: () => {
      toast.success('Branding updated!');
      qc.invalidateQueries({ queryKey: ['admin-branding'] });
    },
    onError: () => toast.error('Failed to save branding'),
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function useSettings() {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/api/v1/settings').then(r => r.data),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Record<string, string>) => api.put('/api/v1/settings', dto),
    onSuccess: () => {
      toast.success('Settings saved!');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export function usePresignedUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      uploadType,
    }: {
      file: File;
      uploadType: 'audio' | 'artwork' | 'avatar' | 'logo';
    }) => {
      const { data: presign } = await api.post('/api/v1/uploads/presign', {
        filename: file.name,
        contentType: file.type,
        uploadType,
      });

      await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      return presign as { uploadUrl: string; key: string; publicUrl: string; bucket: string };
    },
  });
}

// ─── Release Mutations ────────────────────────────────────────────────────────
export function useApproveRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/api/v1/releases/${id}/approve`, { notes }),
    onSuccess: () => {
      toast.success('Release approved!');
      qc.invalidateQueries({ queryKey: ['admin-releases'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: () => toast.error('Approval failed'),
  });
}

export function useRejectRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/v1/releases/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Release rejected');
      qc.invalidateQueries({ queryKey: ['admin-releases'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: () => toast.error('Rejection failed'),
  });
}

export function useSubmitRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/releases/${id}/submit`),
    onSuccess: () => {
      toast.success('Release submitted for review! 🎉');
      qc.invalidateQueries({ queryKey: ['releases'] });
      qc.invalidateQueries({ queryKey: ['release-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Submission failed'),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/admin/users/${id}/toggle-active`),
    onSuccess: () => {
      toast.success('User status updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Update failed'),
  });
}
