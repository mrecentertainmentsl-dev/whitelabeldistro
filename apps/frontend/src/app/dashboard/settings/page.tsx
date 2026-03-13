'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, Eye, EyeOff, Save, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  displayName: z.string().optional(),
  labelName: z.string().optional(),
  bio: z.string().optional(),
});

const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PwdForm = z.infer<typeof pwdSchema>;

function Sec({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{desc}</p>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

export default function DashboardSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { register: regP, handleSubmit: handleP, formState: { errors: errsP, isSubmitting: subP } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', displayName: user?.displayName || '', labelName: user?.labelName || '', bio: user?.bio || '' },
  });

  const { register: regW, handleSubmit: handleW, reset: resetW, formState: { errors: errsW, isSubmitting: subW } } = useForm<PwdForm>({
    resolver: zodResolver(pwdSchema),
  });

  // Avatar upload
  const { getRootProps: getAvRootProps, getInputProps: getAvInputProps } = useDropzone({
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1, maxSize: 5 * 1024 * 1024,
    onDrop: async (files) => {
      const file = files[0]; if (!file) return;
      setAvatarUploading(true);
      try {
        const { data: p } = await api.post('/api/v1/uploads/presign', { filename: file.name, contentType: file.type, uploadType: 'avatar' });
        await fetch(p.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        await api.patch('/api/v1/users/me', { avatarUrl: p.publicUrl });
        updateUser({ avatarUrl: p.publicUrl });
        toast.success('Avatar updated');
      } catch { toast.error('Upload failed'); } finally { setAvatarUploading(false); }
    },
  });

  const saveProfile = async (data: ProfileForm) => {
    try {
      const res = await api.patch('/api/v1/users/me', data);
      updateUser(res.data);
      toast.success('Profile saved');
    } catch { toast.error('Save failed'); }
  };

  const savePwd = async (data: PwdForm) => {
    try {
      await api.post('/api/v1/users/me/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed');
      resetW();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Account Settings</h1>

      {/* Avatar */}
      <Sec title="Profile Photo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User style={{ width: 24, height: 24, color: 'var(--text-4)' }} />}
          </div>
          <div {...getAvRootProps()} style={{ cursor: 'pointer' }}>
            <input {...getAvInputProps()} />
            <button type="button" className="btn-s btn-sm" style={{ pointerEvents: 'none' }}>
              {avatarUploading ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Upload style={{ width: 13, height: 13 }} />}
              {avatarUploading ? 'Uploading…' : 'Upload Photo'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>JPG or PNG — max 5MB</p>
          </div>
        </div>
      </Sec>

      {/* Profile */}
      <Sec title="Profile Information" desc="Your name and artist details">
        <form onSubmit={handleP(saveProfile)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>First Name</label>
              <input {...regP('firstName')} className="inp" />
              {errsP.firstName && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errsP.firstName.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Last Name</label>
              <input {...regP('lastName')} className="inp" />
              {errsP.lastName && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errsP.lastName.message}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Display / Artist Name</label>
            <input {...regP('displayName')} className="inp" placeholder="Stage name shown publicly" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Label Name</label>
            <input {...regP('labelName')} className="inp" placeholder="Your label or distributor" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email Address</label>
            <input className="inp" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Contact support to change your email address</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Bio</label>
            <textarea {...regP('bio')} className="inp" rows={3} placeholder="Tell us about yourself…" />
          </div>

          <div>
            <button type="submit" disabled={subP} className="btn-p">
              {subP ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
              Save Changes
            </button>
          </div>
        </form>
      </Sec>

      {/* Password */}
      <Sec title="Change Password">
        <form onSubmit={handleW(savePwd)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Current Password</label>
            <input {...regW('currentPassword')} className="inp" type="password" placeholder="••••••••" />
            {errsW.currentPassword && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errsW.currentPassword.message}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input {...regW('newPassword')} className="inp" type={showPw ? 'text' : 'password'}
                     placeholder="8+ characters" style={{ paddingRight: 36 }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
                {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
            {errsW.newPassword && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errsW.newPassword.message}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Confirm New Password</label>
            <input {...regW('confirmPassword')} className="inp" type="password" placeholder="••••••••" />
            {errsW.confirmPassword && <p style={{ fontSize: 11, color: 'var(--danger)' }}>{errsW.confirmPassword.message}</p>}
          </div>

          <div>
            <button type="submit" disabled={subW} className="btn-p">
              {subW ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
              Change Password
            </button>
          </div>
        </form>
      </Sec>

      {/* Danger zone */}
      <Sec title="Danger Zone">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Delete Account</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Permanently remove your account and all data. This cannot be undone.</p>
          </div>
          <button className="btn-danger btn-sm" style={{ flexShrink: 0 }}>Delete Account</button>
        </div>
      </Sec>
    </div>
  );
}
