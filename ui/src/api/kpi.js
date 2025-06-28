// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetKpis() {
  const URL = endpoints.kpi.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshKpis = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    kpis: data || [],
    kpisLoading: isLoading,
    kpisError: error,
    kpisValidating: isValidating,
    kpisEmpty: !isLoading && !data?.length,
    refreshKpis, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetKpi(kpiId) {
  const URL = kpiId ? [endpoints.kpi.details(kpiId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      kpi: data,
      kpiLoading: isLoading,
      kpiError: error,
      kpiValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetKpisWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.kpi.filterList(filter);
  } else {
    URL = endpoints.kpi.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterKpis = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredKpis: data || [],
    filteredKpisLoading: isLoading,
    filteredKpisError: error,
    filteredKpisValidating: isValidating,
    filteredKpisEmpty: !isLoading && !data?.length,
    refreshFilterKpis, // Include the refresh function separately
  };
}

