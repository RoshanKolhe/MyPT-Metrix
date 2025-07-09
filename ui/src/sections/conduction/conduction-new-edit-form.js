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
import FormProvider, { RHFTextField, RHFAutocomplete, RHFSelect } from 'src/components/hook-form';
import {
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useRouter } from 'src/routes/hook';
import { useSnackbar } from 'notistack';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function ConductionNewEditForm({ currentConduction, currentDepartmentTarget }) {
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

  const [trainerTargets, setTrainerTargets] = useState({});

  const [trainerTargetIds, setTrainerTargetIds] = useState({});

  const [kpis, setKpis] = useState([]);

  const [showTrainerTarget, setShowTrainerTarget] = useState(false);

  const [conductionsSchema, setConductionsSchema] = useState(
    Yup.object().shape({
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
  const kpiValues = watch('kpiValues');

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (trainers.length === 0) {
        enqueueSnackbar('No trainers found for selected branch and department', {
          variant: 'error',
        });
        return;
      }
      const key = `${kpis.id}_${kpis.departmentTargetId}`;
      const {
        branch: branchDetails,
        department: departmentDetails,
        trainer: trainerDetails,
        conductionDate,
        kpiValues: kpiInputValues,
      } = formData;
      const conductionPayloads = [];

      Object.entries(kpiInputValues || {}).forEach(([trainerId, trainerKpiValues]) => {
        Object.entries(trainerKpiValues).forEach(([kpiId, value]) => {
          conductionPayloads.push({
            conductionDate,
            conductions: Number(value),
            trainerId: Number(trainerId),
            kpiId: Number(kpiId),
            branchId: branchDetails.id,
            departmentId: departmentDetails.id,
          });
        });
      });

      console.log('Conduction Payloads:', conductionPayloads);

      await axiosInstance.post('/conductions/bulk', conductionPayloads);

      enqueueSnackbar('Conductions submitted successfully!');
      reset();
      router.push(paths.dashboard.conduction.list);
    } catch (error) {
      console.error('Error submitting conduction:', error);
      enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
        variant: 'error',
      });
    }
  });

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

        const initialKpiValues = {};
        trainers.forEach((trainer) => {
          initialKpiValues[trainer.id] = {};
          activeServiceKpis.forEach((kpi) => {
            initialKpiValues[trainer.id][kpi.id] = 0;
          });
        });
        setValue('kpiValues', initialKpiValues);
      } catch (error) {
        console.error('Error fetching service KPIs:', error);
        setKpis([]);
      }
    };

    fetchServiceKpis();
  }, [department, setValue, trainers]);

  useEffect(() => {
    const buildSchema = () => {
      const trainerKpiShape = {};

      if (kpis.length > 0 && trainers.length > 0) {
        trainers.forEach((trainer) => {
          const kpiShape = {};
          kpis.forEach((kpi) => {
            kpiShape[kpi.id] = Yup.number()
              .typeError(`${kpi.name} must be a number`)
              .required(`${kpi.name} is required`)
              .min(0, `${kpi.name} cannot be negative`)
              .integer(`${kpi.name} must be a whole number`);
          });
          trainerKpiShape[trainer.id] = Yup.object().shape(kpiShape);
        });
      }

      let baseSchema = Yup.object().shape({
        conductionDate: Yup.date().required('Conduction date is required'),
        kpiValues: Yup.object().shape(trainerKpiShape),
      });

      // Role-based branching and department requirements
      if (isSuperOrAdmin) {
        baseSchema = baseSchema.shape({
          branch: Yup.object().required('Branch is required'),
          department: Yup.object().required('Department is required'),
        });
      } else if (isCGM) {
        baseSchema = baseSchema.shape({
          branch: Yup.mixed().notRequired(),
          department: Yup.object().required('Department is required'),
        });
      }

      setConductionsSchema(baseSchema);
    };

    buildSchema();
  }, [kpis, trainers, isSuperOrAdmin, isCGM]);

  useEffect(() => {
    if (department?.name) {
      setShowTrainerTarget(true);
    } else {
      setShowTrainerTarget(false);
    }
  }, [department?.name]);

  useEffect(() => {
    const initialTargets = {};
    const idMap = {};

    currentDepartmentTarget?.departmentTargets?.forEach((deptTarget) => {
      const departmentTargetId = deptTarget.id;
      const kpiId = deptTarget.kpi.id;

      deptTarget.trainerTargets?.forEach((tt) => {
        const { trainerId } = tt;
        const key = `${kpiId}_${departmentTargetId}`;

        if (!initialTargets[trainerId]) initialTargets[trainerId] = {};
        if (!idMap[trainerId]) idMap[trainerId] = {};

        initialTargets[trainerId][key] = tt.targetValue;
        idMap[trainerId][key] = tt.id;
      });
    });

    setTrainerTargets(initialTargets);
    setTrainerTargetIds(idMap);
  }, [currentDepartmentTarget]);

  useEffect(() => {
    if (!kpiValues) return;

    const updatedTargets = {};

    Object.keys(kpiValues).forEach((trainerId) => {
      updatedTargets[trainerId] = {};

      Object.keys(kpiValues[trainerId] || {}).forEach((kpiId) => {
        const val = kpiValues[trainerId][kpiId];
        updatedTargets[trainerId][kpiId] = val === '' || val === undefined ? '' : Number(val);
      });
    });

    setTrainerTargets(updatedTargets);
  }, [kpiValues]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
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
              {showTrainerTarget && (
                <Grid item xs={12} mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Assign KPI Values per Trainer
                  </Typography>
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: kpis.length * 150 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Trainer</TableCell>
                          {kpis.map((kpi) => (
                            <TableCell key={kpi.id} sx={{ fontWeight: 'bold' }}>
                              {kpi.name}{' '}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trainers.map((trainer) => (
                          <TableRow key={trainer.id}>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {trainer.firstName} {trainer.lastName}
                            </TableCell>

                            {kpis.map((kpi) => {
                              const key = `${kpi.id}_${kpi.departmentTargetId}`;
                              return (
                                <TableCell key={kpi.id}>
                                  <RHFTextField
                                    name={`kpiValues.${trainer.id}.${kpi.id}`}
                                    label=""
                                    size="small"
                                    type="number"
                                    onKeyDown={(e) => {
                                      const invalidKeys = ['e', 'E', '+', '-', '.'];
                                      if (invalidKeys.includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
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

ConductionNewEditForm.propTypes = {
  currentConduction: PropTypes.object,
  currentDepartmentTarget: PropTypes.object,
};
