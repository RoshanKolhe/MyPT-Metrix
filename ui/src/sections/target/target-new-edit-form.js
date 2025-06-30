// target-new-edit-form.js
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Card, Stack, Grid, Typography, Box, TextField, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFAutocomplete, RHFTextField } from 'src/components/hook-form';
import { useGetBranchs } from 'src/api/branch';
import { useAuthContext } from 'src/auth/hooks';
import { useRouter } from 'src/routes/hook';
import { paths } from 'src/routes/paths';

export default function TargetNewEditForm({ currentTarget }) {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.permissions?.includes('super_admin');
  const isHOD = user?.permissions?.includes('hod');
  const router = useRouter();
  const { branches } = useGetBranchs();
  const { enqueueSnackbar } = useSnackbar();

  const [departments, setDepartments] = useState([]);
  const [cgmUsers, setCgmUsers] = useState([]);
  const [kpiTargets, setKpiTargets] = useState({});

  const validationSchema = Yup.object({
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
    branch: isSuperAdmin ? Yup.object().required('Branch is required') : Yup.mixed().notRequired(),
    cgmUser: isSuperAdmin ? Yup.object().required('Cgm User is required') : Yup.object().nullable(),
    targetValue: isSuperAdmin
      ? Yup.number()
          .typeError('Must be a number')
          .min(1, 'Must be 1 or greater')
          .required('Required')
      : Yup.mixed().notRequired(),
    requestChangeReason: Yup.string(),
  });

  const defaultValues = useMemo(() => {
    const kpiMap =
      currentTarget?.departmentTargets?.reduce((acc, dt) => {
        const key = `${dt.departmentId}_${dt.kpiId}`;
        acc[key] = dt.targetValue;
        return acc;
      }, {}) || {};

    return {
      branch: currentTarget?.branch || null,
      cgmUser: currentTarget?.cgmApproverUser || null,
      startDate: currentTarget?.startDate ? new Date(currentTarget.startDate) : null,
      endDate: currentTarget?.endDate ? new Date(currentTarget.endDate) : null,
      targetValue: currentTarget?.targetValue || 0,
      requestChangeReason: currentTarget?.requestChangeReason || '',
      ...Object.fromEntries(Object.entries(kpiMap).map(([key, value]) => [`kpi_${key}`, value])),
    };
  }, [currentTarget]);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
  });

  const { watch, setValue, handleSubmit, control } = methods;

  const branch = watch('branch');

 const { branchTarget, serviceTarget } = useMemo(() => {
  let sales = 0;
  let service = 0;

  departments.forEach(dept => {
    (dept.kpis || []).forEach(kpi => {
      const key = `${dept.id}_${kpi.id}`;
      const val = Number(kpiTargets[key] || 0);

      if (kpi.type === 'sales') {
        sales += val;
      } else if (kpi.type === 'service') {
        service += val;
      }
    });
  });

  return { branchTarget: sales, serviceTarget: service };
}, [kpiTargets, departments]);

  const fetchCgmUsers = async (branchDetails) => {
    if (branchDetails?.id) {
      const { data } = await axiosInstance.post(`/cgms/by-branch`, { branchId: branchDetails.id });
      setCgmUsers(data);
    } else {
      setCgmUsers([]);
    }
  };

  useEffect(() => {
    if (currentTarget?.departmentTargets) {
      const targetMap = {};
      currentTarget.departmentTargets.forEach((dt) => {
        const key = `${dt.departmentId}_${dt.kpiId}`;
        targetMap[key] = dt.targetValue;
        setValue(`kpi_${key}`, dt.targetValue);
      });
      setKpiTargets(targetMap);
    }
  }, [currentTarget, setValue]);

  useEffect(() => {
    if (branch?.departments) {
      setDepartments(branch.departments);
      fetchCgmUsers(branch);
    }
  }, [branch]);

  useEffect(() => {
    if (branchTarget) {
      setValue('targetValue', branchTarget);
    }
  }, [branchTarget, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const input = {
        branchId: formData.branch?.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        cgmApproverUserId: formData.cgmUser?.id ?? null,
        targetValue: +formData.targetValue,
        status: 0,
        requestChangeReason: formData.requestChangeReason,
        departmentTargets: Object.entries(kpiTargets).map(([key, value]) => {
          const [departmentId, kpiId] = key.split('_');
          return {
            departmentId,
            kpiId,
            targetValue: +value,
          };
        }),
      };
      console.log(input);
      if (currentTarget) {
        await axiosInstance.patch(`/targets/${currentTarget.id}`, input);
        enqueueSnackbar('Target updated successfully!');
      } else {
        await axiosInstance.post('/targets', input);
        enqueueSnackbar('Target sent for approval!');
      }

      router.push(paths.dashboard.target.list);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Something went wrong', { variant: 'error' });
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {isSuperAdmin && (
                <>
                  <Grid item xs={12} md={6}>
                    <RHFAutocomplete
                      name="branch"
                      label="Select Branch"
                      options={branches || []}
                      getOptionLabel={(option) => option?.name || ''}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RHFAutocomplete
                      name="cgmUser"
                      label="Cgm User"
                      options={cgmUsers}
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
                            <Typography variant="body2" color="textSecondary">
                              {option.phoneNumber}
                            </Typography>
                          </div>
                        </li>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RHFTextField name="targetValue" label="Branch Target" disabled />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Start Date"
                      value={field.value}
                      onChange={field.onChange}
                      minDate={new Date()}
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
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="End Date"
                      value={field.value}
                      onChange={field.onChange}
                      minDate={new Date()}
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

              {isSuperAdmin && departments.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    Assign KPI Targets by Department
                  </Typography>
                  <Grid container spacing={2}>
                    {departments.map((dept) => (
                      <Grid item xs={12} key={dept.id}>
                        <Typography variant="subtitle2">{dept.name}</Typography>
                        <Grid container spacing={2} mt={1}>
                          {(dept.kpis || []).map((kpi) => {
                            const key = `${dept.id}_${kpi.id}`;
                            return (
                              <Grid item xs={12} sm={6} key={kpi.id}>
                                <Controller
                                  name={`kpi_${key}`}
                                  control={control}
                                  defaultValue=""
                                  render={({ field, fieldState: { error } }) => (
                                    <TextField
                                      {...field}
                                      label={kpi.name}
                                      type="number"
                                      fullWidth
                                      error={!!error}
                                      helperText={error?.message}
                                      inputProps={{ min: 0 }}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        setKpiTargets((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }));
                                      }}
                                    />
                                  )}
                                />
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}

              {currentTarget?.requestChangeReason && (
                <Grid item xs={12}>
                  <RHFTextField
                    name="requestChangeReason"
                    label="Change Request Reason"
                    multiline
                    rows={3}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  {currentTarget ? 'Update Target' : 'Send for Approval'}
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

TargetNewEditForm.propTypes = {
  currentTarget: PropTypes.object,
};
