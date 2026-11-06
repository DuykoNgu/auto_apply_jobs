import { request, requestBlob } from '@/lib/api-client';
import type { Cv, CvSummary } from './types';

export const listCvs = () => request<CvSummary[]>('/cvs');

export const getCv = (id: string) => request<Cv>(`/cvs/${id}`);

export const getCvFile = (id: string) => requestBlob(`/cvs/${id}/file`);

export function uploadCv(file: File): Promise<CvSummary> {
  const form = new FormData();
  form.append('file', file);
  return request<CvSummary>('/cvs', { method: 'POST', body: form });
}
