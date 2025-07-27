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

export function useGetNotifications(filter) {
  let URL;
  if (filter) {
    URL = endpoints.user.filterNotificationList(filter);
  } else {
    URL = endpoints.user.notifications;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshNotifications = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    notifications: data || [],
    notificationsLoading: isLoading,
    notificationsError: error,
    notificationsValidating: isValidating,
    notificationsEmpty: !isLoading && !data?.length,
    refreshNotifications, // Include the refresh function separately
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

export function useGetDashboradSummary(filter) {
  let URL;
  if (filter) {
    URL = endpoints.user.getFilteredDashboradSummary(filter);
  } else {
    URL = endpoints.user.getDashboradSummary;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardCounts = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    dashboardCounts: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardCounts,
  };
}

export function useGetDashboradChartData(filter) {
  let URL;
  if (filter) {
    URL = endpoints.user.getFilteredChartData(filter);
  } else {
    URL = endpoints.user.getChartData;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradChartData = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    dashboradChartData: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboradChartData,
  };
}

export function useGetDashboradConductionsData(filter) {
  let URL;
  if (filter) {
    URL = endpoints.user.getFilteredConductionsData(filter);
  } else {
    URL = endpoints.user.getConductionsData;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradConductionsData = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    dashboradConductionsData: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboradConductionsData,
  };
}

export function useGetDashboradForecastingData(filter) {
  const URL = endpoints.user.getForecastingData(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradChartData = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    dashboradChartData: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboradChartData,
  };
}
