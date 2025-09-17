// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useCallback, useMemo } from 'react';

// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// Valid sort fields for conductions
export const conductionSortFields = [
  'id',
  'conductions',
  'conductionDate',
  'trainer',
  'branch',
  'department',
  'kpi',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'isDeleted',
];

// ----------------------------------------------------------------------
// Utility: format Date into 'YYYY-MM-DD HH:mm:ss' local string
function formatLocalDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Normalize frontend date into [startOfDay, endOfDay] local strings
function normalizeDateRange(startDate, endDate) {
  const startDateStr = startDate
    ? formatLocalDateTime(new Date(new Date(startDate).setHours(0, 0, 0, 0)))
    : undefined;

  const endDateStr = endDate
    ? formatLocalDateTime(new Date(new Date(endDate).setHours(23, 59, 59, 999)))
    : undefined;

  return { startDateStr, endDateStr };
}

// ----------------------------------------------------------------------
// Hook: Get paginated conductions (basic query params)

export function useGetConductions({
  page = 0,
  rowsPerPage = 25,
  order = 'ASC',
  orderBy = 'id',
  searchTextValue = '',
  startDate,
  endDate,
  extraFilter = {},
}) {
  const backendPage = page + 1;
  const { startDateStr, endDateStr } = normalizeDateRange(startDate, endDate);

  // Build query params
  let query = `page=${backendPage}&rowsPerPage=${rowsPerPage}`;
  if (orderBy) query += `&orderBy=${encodeURIComponent(orderBy)}`;
  if (order) query += `&order=${encodeURIComponent(order)}`;
  if (searchTextValue?.trim()) {
    query += `&search=${encodeURIComponent(searchTextValue.trim())}`;
  }
  if (startDateStr) query += `&startDate=${encodeURIComponent(startDateStr)}`;
  if (endDateStr) query += `&endDate=${encodeURIComponent(endDateStr)}`;

  // Additional filters (like branchId, etc.)
  Object.entries(extraFilter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
  });

  const URL = `${endpoints.conduction.list}?${query}`;
  const { data, error, isLoading, mutate } = useSWR(URL, fetcher);

  const refreshConductions = useCallback(() => mutate(), [mutate]);

  return useMemo(() => {
    const conductions = data?.data || [];
    const totalCount = data?.total ?? 0;

    return {
      conductions,
      totalCount,
      conductionsLoading: isLoading,
      conductionsError: error,
      conductionsEmpty: !isLoading && conductions.length === 0,
      refreshConductions,
    };
  }, [data, isLoading, error, refreshConductions]);
}

// ----------------------------------------------------------------------
// Hook: Get single conduction by ID

export function useGetConduction(conductionId) {
  const URL = conductionId ? [endpoints.conduction.details(conductionId)] : null;
  const { data, error, isLoading, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      conduction: data,
      conductionLoading: isLoading,
      conductionError: error,
      conductionValidating: isValidating,
    }),
    [data, isLoading, error, isValidating],
  );
}

// ----------------------------------------------------------------------
// Hook: Get conductions with advanced filtering (LoopBack filter style)

export function useGetConductionsWithFilter({
  page = 0,
  rowsPerPage = 25,
  order = 'ASC',
  orderBy = 'id',
  searchTextValue = '',
  startDate,
  endDate,
  extraFilter = {},
}) {
  const backendPage = page + 1;
  const { startDateStr, endDateStr } = normalizeDateRange(startDate, endDate);

  const rawFilter = {
    where: { isDeleted: false, ...extraFilter },
    order: orderBy ? [`${orderBy} ${order}`] : undefined,
  };

  if (searchTextValue?.trim()) {
    const search = `%${searchTextValue.trim()}%`;
    rawFilter.where.or = [
      { trainer: { like: search } },
      { branch: { like: search } },
      { department: { like: search } },
      { kpi: { like: search } },
    ];
  }

  if (startDateStr || endDateStr) {
    rawFilter.where.conductionDate = {};
    if (startDateStr) rawFilter.where.conductionDate.gte = startDateStr;
    if (endDateStr) rawFilter.where.conductionDate.lte = endDateStr;
  }

  const queryString = `filter=${encodeURIComponent(
    JSON.stringify(rawFilter)
  )}&page=${backendPage}&rowsPerPage=${rowsPerPage}`;

  const URL = `${endpoints.conduction.list}?${queryString}`;
  const { data, error, isLoading, mutate } = useSWR(URL, fetcher);

  const refreshFilteredConductions = useCallback(() => mutate(), [mutate]);

  return useMemo(() => {
    const filteredConductions =
      data?.data || data?.items || (Array.isArray(data) ? data : []);
    const totalFilteredConductions =
      data?.total ?? (Array.isArray(data) ? data.length : 0);

    return {
      filteredConductions,
      totalFilteredConductions,
      filteredConductionsLoading: isLoading,
      filteredConductionsError: error,
      filteredConductionsEmpty: !isLoading && filteredConductions.length === 0,
      refreshFilteredConductions,
    };
  }, [data, isLoading, error, refreshFilteredConductions]);
}
