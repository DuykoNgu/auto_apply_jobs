import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { getCv, getCvFile, listCvs, uploadCv } from '../api';
import { GIVE_UP_AFTER_MS, nextPollDelay, pendingForMs } from '../lib';
import type { Cv } from '../types';

export function useCurrentCv() {
  const list = useQuery({ queryKey: ['cvs'], queryFn: listCvs });
  const currentId = list.data?.[0]?.id;
  const detail = useQuery({
    queryKey: ['cvs', currentId],
    queryFn: () => getCv(currentId as string),
    enabled: currentId !== undefined,
    refetchInterval: ({ state }) =>
      state.data?.status === 'PENDING'
        ? nextPollDelay(state.dataUpdateCount, pendingForMs(state.data.createdAt))
        : false,
  });
  const cv = detail.data;
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (cv?.status !== 'PENDING') return setStalled(false);
    const remaining = GIVE_UP_AFTER_MS - pendingForMs(cv.createdAt);
    if (remaining <= 0) return setStalled(true);
    setStalled(false);
    const timer = setTimeout(() => setStalled(true), remaining);
    return () => clearTimeout(timer);
  }, [cv?.status, cv?.createdAt]);
  return {
    cv,
    stalled,
    isLoading: list.isPending || (currentId !== undefined && detail.isPending),
    isError: list.isError || detail.isError,
    refetch: () => {
      void list.refetch();
      if (currentId !== undefined) void detail.refetch();
    },
  };
}

export function useUploadCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCv,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cvs'] }),
  });
}

function useOriginalPdfUrl(cvId: string | undefined, enabled: boolean) {
  const file = useQuery({
    queryKey: ['cvs', cvId, 'file'],
    queryFn: () => getCvFile(cvId as string),
    enabled: enabled && cvId !== undefined,
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.data) return setUrl(null);
    const objectUrl = URL.createObjectURL(file.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file.data]);
  return { url, isError: file.isError };
}

export function useOriginalPdf(cv: Cv | undefined) {
  const file = useOriginalPdfUrl(cv?.id, cv?.originalFileType === 'pdf');
  const [viewerFailed, setViewerFailed] = useState(false);
  useEffect(() => setViewerFailed(false), [cv?.id]);
  const onFail = useCallback(() => setViewerFailed(true), []);
  return { show: cv?.originalFileType === 'pdf' && !file.isError && !viewerFailed, url: file.url, onFail };
}
