// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetConductions() {
  const URL = endpoints.conduction.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshConductions = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    conductions: data || [],
    conductionsLoading: isLoading,
    conductionsError: error,
    conductionsValidating: isValidating,
    conductionsEmpty: !isLoading && !data?.length,
    refreshConductions, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetConduction(conductionId) {
  const URL = conductionId ? [endpoints.conduction.details(conductionId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      conduction: data,
      conductionLoading: isLoading,
      conductionError: error,
      conductionValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetConductionsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.conduction.filterList(filter);
  } else {
    URL = endpoints.conduction.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterConductions = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredConductions: data || [],
    filteredConductionsLoading: isLoading,
    filteredConductionsError: error,
    filteredConductionsValidating: isValidating,
    filteredConductionsEmpty: !isLoading && !data?.length,
    refreshFilterConductions, // Include the refresh function separately
  };
}
