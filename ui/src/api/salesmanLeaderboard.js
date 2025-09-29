// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';
// ----------------------------------------------------------------------

export function useGetSalesmanLeaderboardsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.salesmanLeaderboard.filterList(filter);
  } else {
    URL = endpoints.salesmanLeaderboard.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterSalesmanLeaderboards = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredSalesmanLeaderboards: data || [],
    filteredSalesmanLeaderboardsLoading: isLoading,
    filteredSalesmanLeaderboardsError: error,
    filteredSalesmanLeaderboardsValidating: isValidating,
    filteredSalesmanLeaderboardsEmpty: !isLoading && !data?.length,
    refreshFilterSalesmanLeaderboards, // Include the refresh function separately
  };
}

