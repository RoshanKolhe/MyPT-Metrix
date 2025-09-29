// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------


export function useGetUsers({ page = 1, limit = 10 } = {}) {
  const URL = `${endpoints.user.list}?page=${page}&limit=${limit}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return {
    users: data?.data || [],
    total: data?.total || 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    usersLoading: isLoading,
    usersError: error,
    usersValidating: isValidating,
    usersEmpty: !isLoading && !(data?.data?.length > 0),
    refreshUsers: mutate,
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

export function useGetUsersWithFilter({ filter = {}, page = 1, limit = 10 } = {}) {
  const query = new URLSearchParams({ ...filter, page, limit }).toString();
  const URL = endpoints.user.filterList(query);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return {
    filteredUsers: data?.data || [],
    total: data?.total || 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    filteredUsersLoading: isLoading,
    filteredUsersError: error,
    filteredUsersValidating: isValidating,
    filteredUsersEmpty: !isLoading && !(data?.data?.length > 0),
    refreshFilterUsers: mutate,
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

  const refreshDashboardSummary = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.user.getFilteredDashboradSummary(newFilter)
      : endpoints.user.getDashboradSummary;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardCounts: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardSummary,
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

  const refreshDashboradChartData = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.user.getFilteredChartData(newFilter)
      : endpoints.user.getChartData;

    mutate(newURL); // trigger re-fetch for new URL
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

  const refreshDashboradConductionsData = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.user.getFilteredConductionsData(newFilter)
      : endpoints.user.getConductionsData;

    mutate(newURL); // trigger re-fetch for new URL
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

export function useGetDashboradMaleToFemaleRatio(filter) {
  const URL = endpoints.user.getMaleToFemaleRatio(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradMaleToFemaleRatio = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.user.getFilteredConductionsData(newFilter)
      : endpoints.user.getConductionsData;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboradMaleToFemaleRatioData: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboradMaleToFemaleRatio,
  };
}

export function useGetDashboradMemberStatistics(filter) {
  const URL = endpoints.user.getMemberStatistics(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradMemberStatistics = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.user.getFilteredConductionsData(newFilter)
      : endpoints.user.getConductionsData;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardMemberStatistics: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboradMemberStatistics,
  };
}

export function useGetDashboradConductionSummary(filter) {
  let URL;
  if (filter) {
    URL = endpoints.user.getFilteredConductionDashboradSummary(filter);
  } else {
    URL = endpoints.user.getConductionDashboradSummary;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardConductionSummary = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.user.getFilteredDashboradSummary(newFilter)
      : endpoints.user.getDashboradSummary;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    conductionDashboardCounts: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardConductionSummary,
  };
}
