'use client';

import { useState, useCallback } from 'react';
import { extractError } from '@/lib/api';
import toast from 'react-hot-toast';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (err: string) => void;
  successMessage?: string;
  showErrorToast?: boolean;
}

export function useApi<T = any>(
  apiFn: (...args: any[]) => Promise<any>,
  options: UseApiOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFn(...args);
        const result = response.data?.data ?? response.data;
        setData(result);
        if (options.successMessage) toast.success(options.successMessage);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const msg = extractError(err);
        setError(msg);
        if (options.showErrorToast !== false) toast.error(msg);
        options.onError?.(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn],
  );

  return { data, loading, error, execute };
}

export function useQuery<T = any>(apiFn: () => Promise<any>, options: UseApiOptions = {}) {
  const { data, loading, error, execute } = useApi<T>(apiFn, options);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, refetch };
}
