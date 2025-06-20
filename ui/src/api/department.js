// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetDepartments() {
  const URL = endpoints.department.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshDepartments = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    departments: data || [],
    departmentsLoading: isLoading,
    departmentsError: error,
    departmentsValidating: isValidating,
    departmentsEmpty: !isLoading && !data?.length,
    refreshDepartments, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetDepartment(departmentId) {
  const URL = departmentId ? [endpoints.department.details(departmentId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      department: data,
      departmentLoading: isLoading,
      departmentError: error,
      departmentValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetDepartmentsWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.department.filterList(filter);
  } else {
    URL = endpoints.department.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterDepartments = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredDepartments: data || [],
    filteredDepartmentsLoading: isLoading,
    filteredDepartmentsError: error,
    filteredDepartmentsValidating: isValidating,
    filteredDepartmentsEmpty: !isLoading && !data?.length,
    refreshFilterDepartments, // Include the refresh function separately
  };
}

