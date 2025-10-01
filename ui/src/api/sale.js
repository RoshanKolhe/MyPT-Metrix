// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
// utils
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';
import { format } from 'date-fns';

// ----------------------------------------------------------------------
// Valid sort fields for sales (optional, can be used for sorting UI)
export const saleSortFields = [
  'id',
  'memberName',
  'gender',
  'trainingAt',
  'memberType',
  'salesPerson',
  'trainer',
  'branch',
  'department',
  'kpi',
  'contactNo',
  'purchaseDate',
  'membershipTypes',
  'actualPrice',
  'discountPrice',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'isDeleted',
];

// ----------------------------------------------------------------------
// Hook: Get paginated sales without advanced filters
export function useGetSales({
  page = 0, // frontend 0-based
  rowsPerPage = 25,
  order = 'ASC',
  orderBy = 'id',
  searchTextValue = '',
  extraFilter = {},
}) {
  const backendPage = page + 1; // backend expects 1-based

  // Base filter
  const rawFilter = {
    where: { isDeleted: false, ...extraFilter },
    order: orderBy ? [`${orderBy} ${order}`] : undefined,
  };

  if (searchTextValue) {
    const search = `%${searchTextValue}%`;
    rawFilter.where.or = [
      { memberName: { like: search } },
      { salesPerson: { like: search } },
      { trainer: { like: search } },
      { branch: { like: search } },
      { department: { like: search } },
    ];
  }

  const queryString = `filter=${encodeURIComponent(
    JSON.stringify(rawFilter)
  )}&page=${backendPage}&rowsPerPage=${rowsPerPage}`;

  const URL = `${endpoints.sale.list}?${queryString}`;
  const { data, error, isLoading, mutate } = useSWR(URL, fetcher);

  const refreshSales = useCallback(() => {
    mutate();
  }, [mutate]);

  return useMemo(() => {
    const sales = data?.data || data?.items || (Array.isArray(data) ? data : []);
    const totalCount = data?.total ?? (Array.isArray(data) ? data.length : 0);

    return {
      sales,
      totalCount,
      salesLoading: isLoading,
      salesError: error,
      salesEmpty: !isLoading && sales.length === 0,
      refreshSales,
    };
  }, [data, isLoading, error, refreshSales]);
}

// ----------------------------------------------------------------------
// Hook: Get single sale by ID
export function useGetSale(saleId) {
  const URL = saleId ? [endpoints.sale.details(saleId)] : null;
  const { data, error, isLoading, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      sale: data,
      saleLoading: isLoading,
      saleError: error,
      saleValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Hook: Get sales with advanced filtering (including date range)
export function useGetSalesWithFilter({
  page = 0,
  rowsPerPage = 25,
  order = 'ASC',
  orderBy = 'id',
  startDate,
  endDate,
  searchTextValue = '',
  extraFilter = {},
}) {
  const backendPage = page + 1;

  const rawFilter = {
    where: { isDeleted: false, ...extraFilter },
    order: orderBy ? [`${orderBy} ${order}`] : undefined,
  };

  if (searchTextValue) {
    const search = `%${searchTextValue}%`;
    rawFilter.where.or = [
      { memberName: { like: search } },
      { salesPerson: { like: search } },
      { trainer: { like: search } },
      { branch: { like: search } },
      { department: { like: search } },
    ];
  }

  // Build query string with date filters
  let queryString = `filter=${encodeURIComponent(
    JSON.stringify(rawFilter)
  )}&page=${backendPage}&rowsPerPage=${rowsPerPage}`;
  if (startDate && endDate) {
    queryString += `&startDate=${format(new Date(startDate), 'yyyy-MM-dd')}`;
    queryString += `&endDate=${format(new Date(endDate), 'yyyy-MM-dd')}`;
  }

  const URL = `${endpoints.sale.list}?${queryString}`;
  const { data, error, isLoading, mutate } = useSWR(URL, fetcher);

  const refreshFilteredSales = useCallback(() => {
    mutate();
  }, [mutate]);

  return useMemo(() => {
    const filteredSales = data?.data || data?.items || (Array.isArray(data) ? data : []);
    const totalFilteredSales = data?.total ?? (Array.isArray(data) ? data.length : 0);

    return {
      filteredSales,
      totalFilteredSales,
      filteredSalesLoading: isLoading,
      filteredSalesError: error,
      filteredSalesEmpty: !isLoading && filteredSales.length === 0,
      refreshFilteredSales,
    };
  }, [data, isLoading, error, refreshFilteredSales]);
}

export const exportSalesWithFilter = async ({
  startDate,
  endDate,
  searchTextValue = '',
  extraFilter = {},
}) => {
  const startDateISO = startDate ? new Date(startDate).toISOString() : undefined;
  const endDateISO = endDate ? new Date(endDate).toISOString() : undefined;

  const rawFilter = {
    where: { isDeleted: false, ...extraFilter },
  };

  if (searchTextValue) {
    const search = `%${searchTextValue}%`;
    rawFilter.where.or = [
      { memberName: { like: search } },
      { salesPerson: { like: search } },
      { trainer: { like: search } },
      { branch: { like: search } },
      { department: { like: search } },
    ];
  }

  let queryString = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}&export=true`;
  if (startDateISO) queryString += `&startDate=${encodeURIComponent(startDateISO)}`;
  if (endDateISO) queryString += `&endDate=${encodeURIComponent(endDateISO)}`;

  const res = await axiosInstance.get(`${endpoints.sale.list}?${queryString}`);
  return res.data.data; // 👈 only filtered rows (all, no pagination)
};
