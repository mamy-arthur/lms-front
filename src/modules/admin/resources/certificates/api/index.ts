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

export const adminCertificatesApi = {
  ...createResourceApi<Record<string, unknown>, CreateCertificatePayload, UpdateCertificatePayload>(
    'platform/certificates',
  ),
  preview: (id: string, payload: PreviewCertificatePayload) =>
    apiPost<CertificatePreviewResponse>(`platform/certificates/${id}/preview`, payload),
};
