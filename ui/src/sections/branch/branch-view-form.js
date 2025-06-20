/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
// routes
import { useRouter } from 'src/routes/hook';
// components

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFAutocomplete, RHFSelect, RHFTextField } from 'src/components/hook-form';
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
  });

  const defaultValues = useMemo(
    () => ({
      branchName: currentBranch?.name || '',
      description: currentBranch?.description || '',
      isActive: currentBranch ? (currentBranch?.isActive ? '1' : '0') : '1',
      departments: currentBranch?.departments || [],
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

  useEffect(() => {
    if (currentBranch) {
      reset(defaultValues);
    }
  }, [currentBranch, defaultValues, reset]);

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
              <RHFTextField name="branchName" label="Branch Name" disabled />
              <RHFTextField name="description" label="Description" disabled />
              <RHFAutocomplete
                multiple
                name="departments"
                label="Departments"
                options={departments || []}
                getOptionLabel={(option) => `${option?.name}` || ''}
                filterOptions={(x) => x}
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
                disabled
              />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

BranchNewEditForm.propTypes = {
  currentBranch: PropTypes.object,
};
