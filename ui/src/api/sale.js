// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetSales() {
  const URL = endpoints.sale.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshSales = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    sales: data || [],
    salesLoading: isLoading,
    salesError: error,
    salesValidating: isValidating,
    salesEmpty: !isLoading && !data?.length,
    refreshSales, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetSale(saleId) {
  const URL = saleId ? [endpoints.sale.details(saleId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      sale: data,
      saleLoading: isLoading,
      saleError: error,
      saleValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetSalesWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.sale.filterList(filter);
  } else {
    URL = endpoints.sale.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterSales = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredSales: data || [],
    filteredSalesLoading: isLoading,
    filteredSalesError: error,
    filteredSalesValidating: isValidating,
    filteredSalesEmpty: !isLoading && !data?.length,
    refreshFilterSales, // Include the refresh function separately
  };
}
