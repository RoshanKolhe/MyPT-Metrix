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
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    targets: data || [],
    targetsLoading: isLoading,
    targetsError: error,
    targetsValidating: isValidating,
    targetsEmpty: !isLoading && !data?.length,
    refreshTargets, // Include the refresh function separately
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

export function useGetTargetsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.target.filterList(filter);
  } else {
    URL = endpoints.target.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterTargets = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredTargets: data || [],
    filteredTargetsLoading: isLoading,
    filteredTargetsError: error,
    filteredTargetsValidating: isValidating,
    filteredTargetsEmpty: !isLoading && !data?.length,
    refreshFilterTargets, // Include the refresh function separately
  };
}
