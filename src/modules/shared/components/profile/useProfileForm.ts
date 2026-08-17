import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/shared/stores/auth.store';
import { apiGet, apiPatch } from '@/shared/lib/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<File | null>(null);
  // cleared only after the profile query re-confirms the new server URL
  const photoJustUploadedRef = useRef(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Query avant useForm — dataUpdatedAt sert de déclencheur fiable pour le reset
  const {
    data: profileData,
    isError: isProfileError,
    isLoading,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['profile', patchPath, user?.id],
    queryFn: () => apiGet<{ data: ProfileFormValues }>(`${patchPath}/${user!.id}`),
    enabled: !!user?.id,
    gcTime: 0, // pas de cache inter-navigations — fetch frais à chaque visite de la page
  });

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

  // dataUpdatedAt est un timestamp qui change à chaque mise à jour des données,
  // garantissant que reset() s'exécute même si la référence profileData est identique
  useEffect(() => {
    if (!profileData) return;
    const { data } = profileData;
    form.reset({
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      address: data.address ?? null,
      zip_code: data.zip_code ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      timezone: data.timezone ?? null,
      preferred_language: data.preferred_language ?? null,
    });
    // Sync avatar only when the API provides one — never clear an existing avatar
    const raw = data as ProfileFormValues & { profile_photo?: { url: string } | null };
    const freshAvatar = raw.profile_photo?.url ?? null;
    const storeUser = useAuthStore.getState().user;
    if (storeUser && freshAvatar && freshAvatar !== storeUser.avatar) {
      useAuthStore.getState().setAuth({ ...storeUser, avatar: freshAvatar });
    }
    // Clear the preview only when the server has confirmed a new avatar URL.
    if (photoJustUploadedRef.current && freshAvatar) {
      photoJustUploadedRef.current = false;
      setPhotoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt, form]);

  useEffect(() => {
    if (isProfileError) toast.error('Impossible de charger le profil');
  }, [isProfileError]);

  const loadError = isProfileError ? 'Impossible de charger le profil. Veuillez réessayer.' : null;

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

    if (pendingPhotoRef.current) {
      try {
        await uploadUserProfilePhoto(user.id, pendingPhotoRef.current, uploadPath);
        pendingPhotoRef.current = null;
        // photoPreview is intentionally kept: it stays visible until the profile
        // query refetches and the useEffect confirms the server-side URL in the store.
        photoJustUploadedRef.current = true;
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
      setAuth({ ...user, name: `${values.first_name} ${values.last_name}`.trim() });
      toast.success('Profil mis à jour');
      void queryClient.invalidateQueries({ queryKey: ['profile', patchPath, user.id] });
    } catch {
      toast.error('Échec de la mise à jour du profil');
    }
  };

  return {
    form,
    isLoading,
    fileInputRef,
    photoPreview,
    uploadError,
    loadError,
    handlePhotoSelect,
    handleSave,
  };
}
