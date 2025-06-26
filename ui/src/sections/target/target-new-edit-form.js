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
  const [trainers, setTrainers] = useState([]);
  const [cgmUsers, setCgmUsers] = useState([]);

  const [departmentTargets, setDepartmentTargets] = useState({});
  const [trainerTargets, setTrainerTargets] = useState({});

  const [validationSchema, setValidationSchema] = useState(
    Yup.object({
      startDate: Yup.string()
        .required('Start Date is required')
        .test('valid-start', 'Start Date cannot be after End Date', (value, context) => {
          const { endDate } = context.parent;
          return !endDate || new Date(value) <= new Date(endDate);
        }),

      endDate: Yup.string()
        .required('End Date is required')
        .test('valid-end', 'End Date cannot be before Start Date', (value, context) => {
          const { startDate } = context.parent;
          return !startDate || new Date(value) >= new Date(startDate);
        }),
      branch: isSuperAdmin
        ? Yup.object().required('Branch is required')
        : Yup.mixed().notRequired(),
      cgmUser: isSuperAdmin
        ? Yup.object().required('Cgm User is required')
        : Yup.object().nullable(),
      targetValue: isSuperAdmin
        ? Yup.number()
            .typeError('Must be a number')
            .min(1, 'Must be 1 or greater')
            .required('Required')
        : Yup.mixed().notRequired(),
      requestChangeReason: Yup.string(),
    })
  );

  const defaultValues = useMemo(() => {
    const departmentTargetMap =
      currentTarget?.departmentTargets?.reduce((acc, dt) => {
        acc[dt.departmentId] = dt.targetValue;
        return acc;
      }, {}) || {};

    return {
      branch: currentTarget?.branch || null,
      cgmUser: currentTarget?.cgmApproverUser || null,
      startDate: currentTarget?.startDate ? new Date(currentTarget.startDate) : null,
      endDate: currentTarget?.endDate ? new Date(currentTarget.endDate) : null,
      targetValue: currentTarget?.targetValue || 0,
      ...Object.keys(departmentTargetMap).reduce((acc, deptId) => {
        acc[`department_${deptId}`] = departmentTargetMap[deptId];
        return acc;
      }, {}),
      requestChangeReason: currentTarget?.requestChangeReason || '',
    };
  }, [currentTarget]);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const values = watch();
  const branch = watch('branch');

  // Calculate the sum of all department targets
  const branchTarget = useMemo(
    () =>
      Object.values(departmentTargets).reduce((sum, value) => {
        const num = Number(value) || 0;
        return sum + num;
      }, 0),
    [departmentTargets]
  );

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
      };

      // Include target assignments
      if (isSuperAdmin) {
        input.departmentTargets = Object.entries(departmentTargets).map(([deptId, target]) => ({
          departmentId: +deptId,
          targetValue: +target,
        }));
      } else if (isHOD) {
        input.trainerTargets = Object.entries(trainerTargets).map(([trainerId, target]) => ({
          trainerId: +trainerId,
          targetValue: +target,
        }));
      }

      // Decide POST or PATCH based on currentTarget
      if (currentTarget) {
        await axiosInstance.patch(`/targets/${currentTarget.id}`, input);
        enqueueSnackbar('Target updated successfully!');
      } else {
        await axiosInstance.post('/targets', input);
        enqueueSnackbar('Target is sent for approval!');
      }

      router.push(paths.dashboard.target.list);
    } catch (error) {
      enqueueSnackbar(error.message || 'Something went wrong', { variant: 'error' });
    }
  });

  const fetchCgmUsers = async (branchDetails) => {
    console.log(branchDetails);
    try {
      if (branchDetails && branchDetails?.id) {
        const inputData = {
          branchId: branchDetails?.id,
        };
        const { data } = await axiosInstance.post(`/cgms/by-branch`, inputData);
        console.log(data);
        setCgmUsers(data);
      } else {
        setCgmUsers([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentTarget) {
      setValue('targetValue', currentTarget.targetValue);
      setValue('startDate', new Date(currentTarget.startDate));
      setValue('endDate', new Date(currentTarget.endDate));
      setValue('branch', currentTarget.branch); // If branch object is available
      setValue('cgmUser', currentTarget.cgmApproverUser); // Assuming it's the full user object
      setValue('requestChangeReason', currentTarget.requestChangeReason);

      if (currentTarget.departmentTargets) {
        const deptTargets = {};
        currentTarget.departmentTargets.forEach((dt) => {
          setValue(`department_${dt.departmentId}`, dt.targetValue);
          deptTargets[dt.departmentId] = dt.targetValue;
        });
        setDepartmentTargets(deptTargets);
      }
    }
  }, [currentTarget, setValue]);

  useEffect(() => {
    if (isSuperAdmin && branch?.departments) {
      setDepartments(branch.departments);

      // Initialize validation schema for each department
      const departmentValidations = branch.departments.reduce((acc, dept) => {
        acc[`department_${dept.id}`] = Yup.number()
          .typeError('Must be a number')
          .min(0, 'Must be 0 or greater')
          .required('Required');
        return acc;
      }, {});

      // Use functional update to avoid dependency on validationSchema
      setValidationSchema((prevSchema) => {
        const baseFields = {
          startDate: Yup.date().required('Start date is required'),
          endDate: Yup.date()
            .required('End date is required')
            .min(Yup.ref('startDate'), 'End date must be after start date'),
          branch: isSuperAdmin
            ? Yup.object().required('Branch is required')
            : Yup.mixed().notRequired(),
        };

        return Yup.object({
          ...baseFields,
          ...departmentValidations,
        });
      });

      fetchCgmUsers(branch);
    }
  }, [branch, isSuperAdmin]);

  useEffect(() => {
    if (isHOD && user?.branch) {
      setValue('branch', user.branch);
      setDepartments(user?.departments ?? []);

      axiosInstance
        .post('/trainers/by-department', {
          departmentIds: user.departments?.map((d) => d.id),
        })
        .then((res) => setTrainers(res.data))
        .catch(() => setTrainers([]));
    }
  }, [isHOD, user, setValue]);

  useEffect(() => {
    if (branchTarget) {
      setValue('targetValue', branchTarget, { shouldValidate: true });
    }
  }, [branchTarget, setValue]);

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
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RHFAutocomplete
                      name="cgmUser"
                      label="Cgm User"
                      options={cgmUsers}
                      getOptionLabel={(option) =>
                        option && option.firstName && option.lastName
                          ? `${option.firstName} ${option.lastName}`
                          : ''
                      }
                      filterOptions={(x) => x}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
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
                    <RHFTextField label="Branch Target" name="targetValue" disabled />
                  </Grid>
                </>
              )}

              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="Start Date"
                        value={field.value ? new Date(field.value) : null}
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
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="End Date"
                        value={field.value ? new Date(field.value) : null}
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
              </Grid>

              {isSuperAdmin && departments.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Assign Targets to Departments</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {departments.map((dept) => (
                      <Grid item xs={12} sm={6} key={dept.id}>
                        <Controller
                          name={`department_${dept.id}`}
                          control={control}
                          defaultValue=""
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label={dept.name}
                              type="number"
                              error={!!error}
                              helperText={error?.message}
                              inputProps={{
                                min: 0,
                                step: 1,
                              }}
                              onChange={(e) => {
                                field.onChange(e);
                                setDepartmentTargets((prev) => ({
                                  ...prev,
                                  [dept.id]: e.target.value,
                                }));
                              }}
                            />
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}

              {isHOD && trainers.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Assign Targets to Trainers</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {trainers.map((trainer) => (
                      <Grid item xs={12} sm={6} key={trainer.id}>
                        <TextField
                          fullWidth
                          label={`${trainer.firstName} ${trainer.lastName}`}
                          type="number"
                          onChange={(e) =>
                            setTrainerTargets((prev) => ({
                              ...prev,
                              [trainer.id]: e.target.value,
                            }))
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}

              {currentTarget?.requestChangeReason ? (
                <Grid item xs={12}>
                  <RHFTextField
                    label="Change Request Reason"
                    name="requestChangeReason"
                    multiline
                    rows={3}
                  />
                </Grid>
              ) : null}

              <Grid item xs={12} container justifyContent="flex-start" sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" size="small">
                  {currentTarget ? 'Update Target' : 'Send for approval'}
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
