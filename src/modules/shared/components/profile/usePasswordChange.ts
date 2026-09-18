import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSimulationUser } from '@/shared/simulation/useSimulationUser';
import { apiPatch } from '@/shared/lib/apiClient';
import { toast } from 'sonner';

const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Mot de passe actuel requis'),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    password_confirmation: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['password_confirmation'],
  });

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

interface UsePasswordChangeOptions {
  patchPath?: string;
}

export function usePasswordChange({ patchPath = 'platform/users' }: UsePasswordChangeOptions = {}) {
  const user = useSimulationUser();
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  });

  const handleChangePassword = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await apiPatch(`${patchPath}/${user.id}/password`, {
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      form.reset();
      toast.success('Mot de passe modifié');
    } catch (err: unknown) {
      const json =
        err != null && typeof err === 'object' && 'json' in err
          ? (err as { json?: { errors?: { current_password?: string[] }; message?: string } }).json
          : undefined;
      const fieldError = json?.errors?.current_password?.[0];
      if (fieldError) {
        form.setError('current_password', { message: fieldError });
      } else {
        const msg = json?.message ?? 'Échec du changement de mot de passe.';
        form.setError('root', { message: msg });
        toast.error(msg);
      }
    }
  });

  return {
    form,
    showCurrentPwd,
    setShowCurrentPwd,
    showNewPwd,
    setShowNewPwd,
    showConfirmPwd,
    setShowConfirmPwd,
    handleChangePassword,
  };
}
