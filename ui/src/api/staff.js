// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetStaffs() {
  const URL = endpoints.staff.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshStaffs = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    staffs: data || [],
    staffsLoading: isLoading,
    staffsError: error,
    staffsValidating: isValidating,
    staffsEmpty: !isLoading && !data?.length,
    refreshStaffs, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetStaff(staffId) {
  const URL = staffId ? [endpoints.staff.details(staffId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      staff: data,
      staffLoading: isLoading,
      staffError: error,
      staffValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetStaffsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.staff.filterList(filter);
  } else {
    URL = endpoints.staff.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterStaffs = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredStaffs: data || [],
    filteredStaffsLoading: isLoading,
    filteredStaffsError: error,
    filteredStaffsValidating: isValidating,
    filteredStaffsEmpty: !isLoading && !data?.length,
    refreshFilterStaffs, // Include the refresh function separately
  };
}
