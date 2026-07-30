import { useState } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { apiPatch } from '@/shared/lib/apiClient';
import { toast } from 'sonner';

interface UsePasswordChangeOptions {
  patchPath?: string;
}

export function usePasswordChange({ patchPath = 'platform/users' }: UsePasswordChangeOptions = {}) {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await apiPatch(`${patchPath}/${user.id}/password`, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe modifié');
    } catch (err: unknown) {
      const json =
        err != null && typeof err === 'object' && 'json' in err
          ? (err as { json?: { errors?: { current_password?: string[] }; message?: string } }).json
          : undefined;
      const fieldError = json?.errors?.current_password?.[0];
      const msg = fieldError ?? json?.message ?? 'Échec du changement de mot de passe.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPwd,
    setShowCurrentPwd,
    showNewPwd,
    setShowNewPwd,
    showConfirmPwd,
    setShowConfirmPwd,
    isSaving,
    error,
    handleChangePassword,
  };
}
