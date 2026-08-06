import { apiUpload } from '@/shared/lib/apiClient';

export interface UploadedMedia {
  id: string;
  url: string;
  mime_type: string;
}

/**
 * Upload une photo de profil et retourne le media résultant (id + url).
 * @param userId ID de l'utilisateur
 * @param file Fichier image à uploader
 * @param routePrefix 'platform/users' ou 'users' selon le contexte
 */
export async function uploadUserProfilePhoto(
  userId: string,
  file: File,
  routePrefix: 'platform/users' | 'users' = 'platform/users',
): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiUpload<{ data: UploadedMedia }>(
    `${routePrefix}/${userId}/profile-photo`,
    formData,
  );
  return res.data;
}
