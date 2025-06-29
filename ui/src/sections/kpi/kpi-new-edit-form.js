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
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import axiosInstance from 'src/utils/axios';
import { COMMON_STATUS_OPTIONS } from 'src/utils/constants';
import { MenuItem } from '@mui/material';

// ----------------------------------------------------------------------

export default function KpiNewEditForm({ currentKpi }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const NewKpiSchema = Yup.object().shape({
    kpiName: Yup.string().required('Kpi Name is required'),
    description: Yup.string(),
    isActive: Yup.boolean(),
  });

  const defaultValues = useMemo(
    () => ({
      kpiName: currentKpi?.name || '',
      description: currentKpi?.description || '',
      isActive: currentKpi ? (currentKpi?.isActive ? '1' : '0') : '1',
    }),
    [currentKpi]
  );
  console.log(defaultValues);
  const methods = useForm({
    resolver: yupResolver(NewKpiSchema),
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
        name: formData.kpiName,
        description: formData.description,
        isActive: currentKpi ? formData.isActive : true,
      };
      if (!currentKpi) {
        await axiosInstance.post('/kpis', inputData);
      } else {
        console.log('here');
        await axiosInstance.patch(`/kpis/${currentKpi.id}`, inputData);
      }
      reset();
      enqueueSnackbar(currentKpi ? 'Update success!' : 'Create success!');
      // router.push(paths.dashboard.kpi.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (currentKpi) {
      reset(defaultValues);
    }
  }, [currentKpi, defaultValues, reset]);

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
              {currentKpi ? (
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

              <RHFTextField name="kpiName" label="Kpi Name" />
              <RHFTextField name="description" label="Description" />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentKpi ? 'Create Kpi' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

KpiNewEditForm.propTypes = {
  currentKpi: PropTypes.object,
};
