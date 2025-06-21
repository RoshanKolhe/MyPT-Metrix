// eslint-disable-next-line import/no-extraneous-dependencies
import useSWR from 'swr';
import { useMemo } from 'react';
// utils
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetTrainers() {
  const URL = endpoints.trainer.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshTrainers = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    trainers: data || [],
    trainersLoading: isLoading,
    trainersError: error,
    trainersValidating: isValidating,
    trainersEmpty: !isLoading && !data?.length,
    refreshTrainers, // Include the refresh function separately
  };
}

// ----------------------------------------------------------------------

export function useGetTrainer(trainerId) {
  const URL = trainerId ? [endpoints.trainer.details(trainerId)] : null;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      trainer: data,
      trainerLoading: isLoading,
      trainerError: error,
      trainerValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetTrainersWithFilter(filter) {
  let URL;
  if (filter) {
    URL = endpoints.trainer.filterList(filter);
  } else {
    URL = endpoints.trainer.list;
  }

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const refreshFilterTrainers = () => {
    // Use the `mutate` function to trigger a revalidation
    mutate();
  };

  return {
    filteredTrainers: data || [],
    filteredTrainersLoading: isLoading,
    filteredTrainersError: error,
    filteredTrainersValidating: isValidating,
    filteredTrainersEmpty: !isLoading && !data?.length,
    refreshFilterTrainers, // Include the refresh function separately
  };
}
