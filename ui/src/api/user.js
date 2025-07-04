// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetUsers() {
  const URL = endpoints.user.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshUsers = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    users: data || [],
    usersLoading: isLoading,
    usersError: error,
    usersValidating: isValidating,
    usersEmpty: !isLoading && !data?.length,
    refreshUsers, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetUser(userId) {
  const URL = userId ? [endpoints.user.details(userId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      user: data,
      userLoading: isLoading,
      userError: error,
      userValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetUsersWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.user.filterList(filter);
  } else {
    URL = endpoints.user.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterUsers = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredUsers: data || [],
    filteredUsersLoading: isLoading,
    filteredUsersError: error,
    filteredUsersValidating: isValidating,
    filteredUsersEmpty: !isLoading && !data?.length,
    refreshFilterUsers, // Include the refresh function separately
  };
}
