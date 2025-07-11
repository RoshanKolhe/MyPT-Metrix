/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
// components
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import { Chip } from '@mui/material';
import { useRouter } from 'src/routes/hook';
import { useSnackbar } from 'notistack';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function ConductionViewForm({ currentConduction }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');
  const isCGM = user?.permissions?.includes('cgm');
  const isDepartmentUser =
    user?.permissions?.includes('hod') || user?.permissions?.includes('sub_hod');

  const shouldAutoAssignBranch = !currentConduction && (isCGM || isDepartmentUser);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches } = useGetBranchsWithFilter(encodedFilter);

  const [departments, setDepartments] = useState([]);

  const [trainers, setTrainers] = useState([]);

  const [kpis, setKpis] = useState([]);

  const [conductionsSchema, setConductionsSchema] = useState(
    Yup.object().shape({
      trainer: Yup.object().nullable().required('Trainer is required'),
      conductionDate: Yup.date().required('Conduction date is required'),
    })
  );

  const defaultValues = useMemo(
    () => ({
      department: currentConduction?.department || null,
      branch: currentConduction?.branch || null,
      trainer: currentConduction?.trainer || null,
      conductionDate: currentConduction?.membershipDetails?.conductionDate
        ? new Date(currentConduction?.membershipDetails?.conductionDate)
        : null,
      kpiValues: {},
    }),
    [currentConduction]
  );

  const methods = useForm({
    resolver: yupResolver(conductionsSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;
  console.log(errors);
  const branch = watch('branch');
  const department = watch('department');

  useEffect(() => {
    if (currentConduction) {
      reset(defaultValues);
    }
  }, [currentConduction, defaultValues, reset]);

  useEffect(() => {
    if (!currentConduction && isDepartmentUser && user?.departments?.length > 0) {
      setDepartments(user.departments);
    }
  }, [user?.departments, isDepartmentUser, currentConduction]);

  useEffect(() => {
    if (shouldAutoAssignBranch && user?.branch) {
      const userBranch = branches?.find((b) => b.id === user.branch.id);
      if (userBranch) {
        setValue('branch', userBranch);
      }
    }
  }, [shouldAutoAssignBranch, user?.branch, branches, setValue]);

  useEffect(() => {
    if (isSuperOrAdmin) {
      setConductionsSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.object().required('Branch is required'),
            department: Yup.object().required('Department is required'),
          })
        )
      );
    } else if (isCGM) {
      setConductionsSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.object().required('Department is required'),
          })
        )
      );
    } else {
      setConductionsSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.mixed().notRequired(),
          })
        )
      );
    }
  }, [isCGM, isSuperOrAdmin, user?.permissions]);

  useEffect(() => {
    if (branch && branch.departments) {
      const activeDepartments = branch.departments.filter((dept) => dept.isActive);
      setDepartments(activeDepartments);
    }
  }, [branch]);

  useEffect(() => {
    const fetchTrainers = async () => {
      console.log(branch, department);
      if (!branch || !department) return;
      try {
        const res = await axiosInstance.post('/trainers/by-branch-department', {
          branchId: branch.id,
          departmentId: department?.id,
        });

        const fetchedTrainers = res.data || [];
        setTrainers(fetchedTrainers);
      } catch (error) {
        setTrainers([]);
        console.error('Failed to fetch trainers:', error);
      }
    };

    fetchTrainers();
  }, [branch, department]);

  useEffect(() => {
    const fetchServiceKpis = async () => {
      if (!department?.id) return;

      try {
        const res = await axiosInstance.get(`/departments/${department.id}/service-kpis`);
        const activeServiceKpis = res.data;
        setKpis(activeServiceKpis);

        // Initialize KPI values with empty inputs
        const initialKpiValues = {};
        activeServiceKpis.forEach((kpi) => {
          initialKpiValues[kpi.id] = '';
        });
        setValue('kpiValues', initialKpiValues);
      } catch (error) {
        console.error('Error fetching service KPIs:', error);
        setKpis([]);
      }
    };

    fetchServiceKpis();
  }, [department, setValue]);

  useEffect(() => {
    if (kpis.length > 0) {
      const kpiFieldShape = {};
      kpis.forEach((kpi) => {
        kpiFieldShape[kpi.id] = Yup.string().required(`${kpi.name} is required`);
      });

      setConductionsSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            kpiValues: Yup.object().shape(kpiFieldShape),
          })
        )
      );
    }
  }, [kpis]);

  return (
    <FormProvider methods={methods}>
      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  name="branch"
                  label="Branch"
                  options={branches || []}
                  getOptionLabel={(option) => `${option?.name}` || ''}
                  filterOptions={(x) => x}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {option?.name}
                      </Typography>
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, tagIndex) => (
                      <Chip
                        {...getTagProps({ index: tagIndex })}
                        key={option.id}
                        label={option.name}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    ))
                  }
                  disabled={shouldAutoAssignBranch}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  name="department"
                  label="Department"
                  options={departments || []}
                  getOptionLabel={(option) => `${option?.name}` || ''}
                  filterOptions={(x) => x}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {option?.name}
                      </Typography>
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, tagIndex) => (
                      <Chip
                        {...getTagProps({ index: tagIndex })}
                        key={option.id}
                        label={option.name}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    ))
                  }
                />
              </Grid>
            </Grid>
            <Typography variant="h6" gutterBottom mt={2}>
              Details
            </Typography>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="conductionDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Conduction Date"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  name="trainer"
                  label="Trainer"
                  options={trainers}
                  getOptionLabel={(option) => `${option?.firstName} ${option?.lastName}` || ''}
                  isOptionEqualToValue={(a, b) => a?.id === b?.id}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {`${option?.firstName} ${option?.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {option.email}
                        </Typography>
                      </div>
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    ))
                  }
                />
              </Grid>
              {kpis.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    KPI Inputs
                  </Typography>
                  <Grid container spacing={2} mt={2}>
                    {kpis.map((kpi) => (
                      <Fragment key={kpi.id}>
                        <Grid item xs={12} sm={6}>
                          <RHFTextField name={`kpiValues.${kpi.id}`} label={kpi.name} fullWidth />
                        </Grid>
                      </Fragment>
                    ))}
                  </Grid>
                </Grid>
              )}
              <Grid item xs={12} md={12}>
                <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                  <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                    {currentConduction ? 'Update Conduction' : 'Create Conduction'}
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

ConductionViewForm.propTypes = {
  currentConduction: PropTypes.object,
};
