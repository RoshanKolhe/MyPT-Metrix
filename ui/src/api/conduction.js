// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';
import { buildFilter, formatDate } from 'src/utils/constants';

// ----------------------------------------------------------------------
const conductionSortFields = [
  'id',
  'conductions',
  'conductionDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'isDeleted',
];


export function useGetConductions({ page, rowsPerPage, order, orderBy, startDate, endDate, searchTextValue, }) {
  const filter = buildFilter({ page, rowsPerPage, order, orderBy, startDate, endDate , validSortFields: conductionSortFields, searchTextValue, });

  const queryString = `filter=${encodeURIComponent(JSON.stringify(filter))}`;
  const URL = `${endpoints.conduction.list}?${queryString}`;
  console.log('Filter being sent:', filter);
  console.log('Search text:', searchTextValue);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshConductions = useCallback(() => {
    mutate();
  }, [mutate]);
  const memoizedValue = useMemo(
    () => ({
      conductions: data?.data || [],
      totalCount: data?.total || 0,
      conductionsLoading: isLoading,
      conductionsError: error,
      conductionsValidating: isValidating,
      conductionsEmpty: !isLoading && (!data?.data || data.data.length === 0),
      refreshConductions,
    }),
    [data?.data, data?.total, error, isLoading, isValidating, refreshConductions]
  );

  return memoizedValue;
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
