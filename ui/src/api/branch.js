// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetBranchs() {
  const URL = endpoints.branch.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshBranchs = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    branches: data || [],
    branchesLoading: isLoading,
    branchesError: error,
    branchesValidating: isValidating,
    branchesEmpty: !isLoading && !data?.length,
    refreshBranchs, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetBranch(branchId) {
  const URL = branchId ? [endpoints.branch.details(branchId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      branch: data,
      branchLoading: isLoading,
      branchError: error,
      branchValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetBranchsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.branch.filterList(filter);
  } else {
    URL = endpoints.branch.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterbranches = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredbranches: data || [],
    filteredbranchesLoading: isLoading,
    filteredbranchesError: error,
    filteredbranchesValidating: isValidating,
    filteredbranchesEmpty: !isLoading && !data?.length,
    refreshFilterbranches, // Include the refresh function separately
  };
}

