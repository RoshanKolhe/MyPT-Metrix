// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

export function useGetDashboradSummary(filter) {
  let URL;
  if (filter) {
    URL = endpoints.dashboard.getFilteredDashboradSummary(filter);
  } else {
    URL = endpoints.dashboard.getDashboradSummary;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardSummary = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredDashboradSummary(newFilter)
      : endpoints.dashboard.getDashboradSummary;

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
    URL = endpoints.dashboard.getFilteredChartData(filter);
  } else {
    URL = endpoints.dashboard.getChartData;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradChartData = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredChartData(newFilter)
      : endpoints.dashboard.getChartData;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboradChartData: data || [],
    isLoadingDashboradChartData: isLoading,
    error,
    isValidating,
    refreshDashboradChartData,
  };
}

export function useGetDashboradMonthlyData(filter) {
  let URL;
  if (filter) {
    URL = endpoints.dashboard.getFilteredMonthlyData(filter);
  } else {
    URL = endpoints.dashboard.getMonthlyData;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradMonthlyData = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredMonthlyData(newFilter)
      : endpoints.dashboard.getMonthlyData;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboradMonthlyData: data || [],
    isLoadingDashboradMonthlyData: isLoading,
    error,
    isValidating,
    refreshDashboradMonthlyData,
  };
}

export function useGetDashboradConductionsData(filter) {
  let URL;
  if (filter) {
    URL = endpoints.dashboard.getFilteredConductionsData(filter);
  } else {
    URL = endpoints.dashboard.getConductionsData;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradConductionsData = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredConductionsData(newFilter)
      : endpoints.dashboard.getConductionsData;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboradConductionsData: data || [],
    isLoadingConductionsData: isLoading,
    error,
    isValidating,
    refreshDashboradConductionsData,
  };
}

export function useGetDashboradForecastingData(filter) {
  let URL;
  if (filter) {
    URL = endpoints.dashboard.getForecastingDataWithFilter(filter);
  } else {
    URL = endpoints.dashboard.getForecastingData;
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

export function useGetDashboradMaleToFemaleRatio(filter) {
  const URL = endpoints.dashboard.getMaleToFemaleRatio(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradMaleToFemaleRatio = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredConductionsData(newFilter)
      : endpoints.dashboard.getConductionsData;

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

export function useGetDashboradPtsVsMembershipRatio(filter) {
  const URL = endpoints.dashboard.getPtsVsMembershipRatio(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradPtsVsMembershipRatio = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredConductionsData(newFilter)
      : endpoints.dashboard.getConductionsData;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboradPtsVsMembershipRatioData: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboradPtsVsMembershipRatio,
  };
}

export function useGetDashboradMemberStatistics(filter) {
  const URL = endpoints.dashboard.getMemberStatistics(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboradMemberStatistics = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredConductionsData(newFilter)
      : endpoints.dashboard.getConductionsData;

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
    URL = endpoints.dashboard.getFilteredConductionDashboradSummary(filter);
  } else {
    URL = endpoints.dashboard.getConductionDashboradSummary;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardConductionSummary = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilteredDashboradSummary(newFilter)
      : endpoints.dashboard.getDashboradSummary;

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

// export function useGetPtSalesRank(filter) {
//   let URL;
//   if (filter) {
//     URL = endpoints.user.getFilterPtSales(filter);
//   } else {
//     URL = endpoints.user.getPtSales;
//   }

//   const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

//   const refreshDashboardPtSalesRank = (newFilter = filter) => {
//     const newURL = newFilter
//       ? endpoints.user.getFilterPtSales(newFilter)
//       : endpoints.user.getPtSales;

//     mutate(newURL); // trigger re-fetch for new URL
//   };

//   return {
//     dashboardPtSalesRank: data || [],
//     isLoading,
//     error,
//     isValidating,
//     refreshDashboardPtSalesRank,
//   };
// }

export function useGetPtSalesRank(filter) {
  const URL = endpoints.dashboard.getFilterPtSales(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardPtSalesRank = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilterPtSales(newFilter)
      : endpoints.dashboard.getPtSales;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardPtSalesRank: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardPtSalesRank,
  };
}

export function useGetPtConductionsRank(filter) {
  const URL = endpoints.dashboard.getFilterPtConductions(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardPtConductionsRank = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilterPtConductions(newFilter)
      : endpoints.dashboard.getPtConductions;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardPtConductionsRank: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardPtConductionsRank,
  };
}

export function useGetPtRanks(filter) {
  const URL = endpoints.dashboard.getFilterPtRanks(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardPtRanks = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getFilterPtRanks(newFilter)
      : endpoints.dashboard.getPtRanks;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardPtRanks: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardPtRanks,
  };
}

export function useGetDashobardRevenueByPaymentMode(filter) {
  const URL = endpoints.dashboard.getRevenueByPaymentMode(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardRevenueByPaymentMode = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getRevenueByPaymentMode(newFilter)
      : endpoints.dashboard.getRevenueByPaymentMode;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardRevenueByPaymentMode: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardRevenueByPaymentMode,
  };
}

export function useGetDashobardKpiSummary(filter) {
  const URL = endpoints.dashboard.getKpiSummary(filter);

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDashboardKpiSummary = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getKpiSummary(newFilter)
      : endpoints.dashboard.getKpiSummary;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    dashboardKpisummary: data || [],
    isLoading,
    error,
    isValidating,
    refreshDashboardKpiSummary,
  };
}

export function useGetBranchWiseAnalytics(filter) {
  const URL = filter ? endpoints.dashboard.getBranchWiseAnalytics(filter) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshBranchWiseAnalytics = (newFilter = filter) => {
    const newURL = newFilter
      ? endpoints.dashboard.getBranchWiseAnalytics(newFilter)
      : null;

    mutate(newURL); // trigger re-fetch for new URL
  };

  return {
    branchWiseAnalytics: data || [],
    isLoadingBranchWiseAnalytics: isLoading,
    error,
    isValidating,
    refreshBranchWiseAnalytics,
  };
}