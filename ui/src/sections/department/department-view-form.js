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

export default function DepartmentNewEditForm({ currentDepartment }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const NewDepartmentSchema = Yup.object().shape({
    departmentName: Yup.string().required('Department Name is required'),
    description: Yup.string(),
    isActive: Yup.boolean(),
  });

  const defaultValues = useMemo(
    () => ({
      departmentName: currentDepartment?.name || '',
      description: currentDepartment?.description || '',
      isActive: currentDepartment ? (currentDepartment?.isActive ? '1' : '0') : '1',
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

  const values = watch();

  useEffect(() => {
    if (currentDepartment) {
      reset(defaultValues);
    }
  }, [currentDepartment, defaultValues, reset]);

  return (
    <FormProvider methods={methods}>
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
              <RHFSelect name="isActive" label="Status" disabled>
                {COMMON_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </RHFSelect>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
              <RHFTextField name="departmentName" label="Department Name" disabled />
              <RHFTextField name="description" label="Description" disabled />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

DepartmentNewEditForm.propTypes = {
  currentDepartment: PropTypes.object,
};
