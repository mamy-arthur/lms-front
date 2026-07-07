import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '@/shared/lib/apiClient';
import type {
  Certificate,
  CreateCertificatePayload,
  PreviewCertificatePayload,
  UpdateCertificatePayload,
} from '../types';

interface CertificateListResponse {
  data?: Record<string, unknown>[];
}

interface CertificatePreviewResponse {
  data: { body: string; resolved: boolean };
}

interface CertificateMediaResponse {
  data: { id: string; mime_type: string; original_name: string };
}

export const portalCertificatesApi = {
  list: () => apiGet<CertificateListResponse>(`certificates`),

  getById: (id: string) => apiGet<{ data: Certificate }>(`certificates/${id}`),

  create: (data: CreateCertificatePayload) =>
    apiPost<{ data: Record<string, unknown> }>(`certificates`, data),

  update: (id: string, data: UpdateCertificatePayload) =>
    apiPatch<{ data: Record<string, unknown> }>(`certificates/${id}`, data),

  remove: (id: string) => apiDelete(`certificates/${id}`),

  preview: (id: string, payload: PreviewCertificatePayload) =>
    apiPost<CertificatePreviewResponse>(`certificates/${id}/preview`, payload),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<CertificateMediaResponse>(`certificates/media`, formData);
  },
};
