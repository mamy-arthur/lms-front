import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/shared/stores/auth.store';
import { apiGet, apiPatch } from '@/shared/lib/apiClient';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { toast } from 'sonner';

export const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(120),
  last_name: z.string().min(1, 'Nom requis').max(120),
  address: z.string().max(255).nullable().optional(),
  zip_code: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  timezone: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface UseProfileFormOptions {
  uploadPath?: 'platform/users' | 'users';
  patchPath?: string;
}

export function useProfileForm({
  uploadPath = 'platform/users',
  patchPath = 'platform/users',
}: UseProfileFormOptions = {}) {
  const { user, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      address: null,
      zip_code: null,
      city: null,
      country: null,
      timezone: null,
      preferred_language: null,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (!user?.id) return;
    setLoadError(null);
    apiGet<{ data: ProfileFormValues }>(`${patchPath}/${user.id}`)
      .then(({ data }) => {
        reset({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          address: data.address ?? null,
          zip_code: data.zip_code ?? null,
          city: data.city ?? null,
          country: data.country ?? null,
          timezone: data.timezone ?? null,
          preferred_language: data.preferred_language ?? null,
        });
      })
      .catch(() => {
        setLoadError('Impossible de charger le profil. Veuillez réessayer.');
        toast.error('Impossible de charger le profil');
      });
  }, [user?.id, patchPath, reset]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingPhotoRef.current = file;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (values: ProfileFormValues) => {
    if (!user) return;
    setUploadError(null);

    let updatedUser = user;

    if (pendingPhotoRef.current) {
      try {
        const media = await uploadUserProfilePhoto(user.id, pendingPhotoRef.current, uploadPath);
        updatedUser = { ...user, avatar: media.url };
        setAuth(updatedUser);
        pendingPhotoRef.current = null;
        setPhotoPreview(null);
      } catch {
        setUploadError("Échec de l'upload de la photo.");
        toast.error("Échec de l'upload de la photo");
        return;
      }
    }

    try {
      await apiPatch(`${patchPath}/${user.id}`, {
        first_name: values.first_name,
        last_name: values.last_name,
        address: values.address || null,
        zip_code: values.zip_code || null,
        city: values.city || null,
        country: values.country || null,
        timezone: values.timezone || null,
        preferred_language: values.preferred_language || null,
      });
      setAuth({ ...updatedUser, name: `${values.first_name} ${values.last_name}`.trim() });
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Échec de la mise à jour du profil');
    }
  };

  return {
    form,
    fileInputRef,
    photoPreview,
    uploadError,
    loadError,
    handlePhotoSelect,
    handleSave,
  };
}
