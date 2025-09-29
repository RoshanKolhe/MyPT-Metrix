// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';
// ----------------------------------------------------------------------

export function useGetCountrySalesLeaderboardsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.countrySalesLeaderboard.filterList(filter);
  } else {
    URL = endpoints.countrySalesLeaderboard.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterCountrySalesLeaderboards = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredCountrySalesLeaderboards: data || [],
    filteredCountrySalesLeaderboardsLoading: isLoading,
    filteredCountrySalesLeaderboardsError: error,
    filteredCountrySalesLeaderboardsValidating: isValidating,
    filteredCountrySalesLeaderboardsEmpty: !isLoading && !data?.length,
    refreshFilterCountrySalesLeaderboards, // Include the refresh function separately
  };
}

