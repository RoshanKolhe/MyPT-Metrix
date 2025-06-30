/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
// utils
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
// components

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import axiosInstance from 'src/utils/axios';
import { COMMON_STATUS_OPTIONS } from 'src/utils/constants';
import { Chip, MenuItem, Typography } from '@mui/material';
import { useGetDepartments } from 'src/api/department';

// ----------------------------------------------------------------------

export default function BranchNewEditForm({ currentBranch }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { departments, departmentsLoading, departmentsEmpty, refreshDepartments } =
    useGetDepartments();

  const NewBranchSchema = Yup.object().shape({
    branchName: Yup.string().required('Branch Name is required'),
    description: Yup.string(),
    isActive: Yup.boolean(),
    departments: Yup.array().min(1, 'Must have at least 1 Department'),
  });

  const defaultValues = useMemo(
    () => ({
      branchName: currentBranch?.name || '',
      description: currentBranch?.description || '',
      departments: currentBranch?.departments || [],
      isActive: currentBranch ? (currentBranch?.isActive ? '1' : '0') : '1',
    }),
    [currentBranch]
  );
  console.log(defaultValues);
  const methods = useForm({
    resolver: yupResolver(NewBranchSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      console.info('DATA', formData);
      const inputData = {
        name: formData.branchName,
        description: formData.description,
        isActive: currentBranch ? formData.isActive : true,
        departments: formData.departments,
      };
      if (!currentBranch) {
        await axiosInstance.post('/branches', inputData);
      } else {
        console.log('here');
        await axiosInstance.patch(`/branches/${currentBranch.id}`, inputData);
      }
      reset();
      enqueueSnackbar(currentBranch ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.branch.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (currentBranch) {
      reset(defaultValues);
    }
  }, [currentBranch, defaultValues, reset]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              {currentBranch ? (
                <>
                  <RHFSelect name="isActive" label="Status">
                    {COMMON_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
                </>
              ) : null}

              <RHFTextField name="branchName" label="Branch Name" />
              <RHFTextField name="description" label="Description" />
              <RHFAutocomplete
                multiple
                name="departments"
                label="Departments"
                options={departments || []}
                getOptionLabel={(option) => `${option?.name}` || ''}
                filterOptions={(options, state) =>
                  options.filter((option) =>
                    option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {`${option?.name}`}
                      </Typography>
                    </div>
                  </li>
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((option, tagIndex) => (
                    <Chip
                      {...getTagProps({ index: tagIndex })}
                      key={option.id}
                      label={`${option.name}`}
                      size="small"
                      color="info"
                      variant="soft"
                    />
                  ))
                }
              />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentBranch ? 'Create Branch' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

BranchNewEditForm.propTypes = {
  currentBranch: PropTypes.object,
};
