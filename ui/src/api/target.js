// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetTargets() {
  const URL = endpoints.target.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshTargets = () => {
    mutate();
  };

  return {
    targets: data || [],
    targetsLoading: isLoading,
    targetsError: error,
    targetsValidating: isValidating,
    targetsEmpty: !isLoading && !data?.length,
    refreshTargets,
  };
}

// ----------------------------------------------------------------------

export function useGetTarget(targetId) {
  const URL = targetId ? [endpoints.target.details(targetId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      target: data,
      targetLoading: isLoading,
      targetError: error,
      targetValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetDepartmentTarget(targetId, depTargetId) {
  const URL = depTargetId && targetId ? [endpoints.target.depTarget(targetId, depTargetId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      depTarget: data,
      depTargetLoading: isLoading,
      depTargetError: error,
      depTargetValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetTargetsWithFilter(filter = {}) {
  // Build query string for backend filtering
  const queryParams = new URLSearchParams();

  if (filter.name) queryParams.append('name', filter.name);
  if (filter.status && filter.status !== 'all') queryParams.append('status', filter.status);

  const URL = `${endpoints.target.list}?${queryParams.toString()}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterTargets = () => {
    mutate();
  };

  return {
    filteredTargets: data || [],
    filteredTargetsLoading: isLoading,
    filteredTargetsError: error,
    filteredTargetsValidating: isValidating,
    filteredTargetsEmpty: !isLoading && !data?.length,
    refreshFilterTargets,
  };
}
