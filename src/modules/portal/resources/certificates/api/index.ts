import { apiPost } from '@/shared/lib/apiClient';
import { createResourceApi } from '@modules/shared/lib/createResourceApi';
import type {
  CreateCertificatePayload,
  PreviewCertificatePayload,
  UpdateCertificatePayload,
} from '../types';

interface CertificatePreviewResponse {
  data: { body: string; resolved: boolean };
}

export const portalCertificatesApi = {
  ...createResourceApi<Record<string, unknown>, CreateCertificatePayload, UpdateCertificatePayload>(
    'certificates',
  ),
  preview: (id: string, payload: PreviewCertificatePayload) =>
    apiPost<CertificatePreviewResponse>(`certificates/${id}/preview`, payload),
};
