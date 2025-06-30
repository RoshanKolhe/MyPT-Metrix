/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo } from 'react';
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
import { useGetKpis } from 'src/api/kpi';

// ----------------------------------------------------------------------

export default function DepartmentNewEditForm({ currentDepartment }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { kpis, kpisLoading, kpisEmpty, refreshKpis } = useGetKpis();

  const NewDepartmentSchema = Yup.object().shape({
    departmentName: Yup.string().required('Department Name is required'),
    description: Yup.string(),
    isActive: Yup.boolean(),
    kpis: Yup.array().min(1, 'Must have at least 1 Kpi'),
  });

  const defaultValues = useMemo(
    () => ({
      departmentName: currentDepartment?.name || '',
      description: currentDepartment?.description || '',
      isActive: currentDepartment ? (currentDepartment?.isActive ? '1' : '0') : '1',
      kpis: currentDepartment?.kpis || [],
    }),
    [currentDepartment]
  );
  console.log(defaultValues);
  const methods = useForm({
    resolver: yupResolver(NewDepartmentSchema),
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
        name: formData.departmentName,
        description: formData.description,
        isActive: currentDepartment ? formData.isActive : true,
        kpiIds: formData.kpis?.map((kpi) => kpi.id) || [],
      };

      if (!currentDepartment) {
        await axiosInstance.post('/departments', inputData);
      } else {
        await axiosInstance.patch(`/departments/${currentDepartment.id}`, inputData);
      }

      reset();
      enqueueSnackbar(currentDepartment ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.department.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(
        typeof error === 'string' ? error : error?.error?.message || 'Something went wrong.',
        {
          variant: 'error',
        }
      );
    }
  });

  useEffect(() => {
    if (currentDepartment) {
      reset(defaultValues);
    }
  }, [currentDepartment, defaultValues, reset]);

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
              {currentDepartment ? (
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

              <RHFTextField name="departmentName" label="Department Name" />
              <RHFTextField name="description" label="Description" />
              <RHFAutocomplete
                multiple
                name="kpis"
                label="Kpi"
                options={kpis || []}
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
                      <Typography variant="subtitle2">{`${option?.name}`}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {option?.type}
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
                {!currentDepartment ? 'Create Department' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

DepartmentNewEditForm.propTypes = {
  currentDepartment: PropTypes.object,
};
