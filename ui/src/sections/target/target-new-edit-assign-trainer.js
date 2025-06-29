import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Alert,
} from '@mui/material';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form';
import { useGetKpis } from 'src/api/kpi';

export default function TargetNewEditAssignTrainerForm({ currentDepartmentTarget }) {
  const { enqueueSnackbar } = useSnackbar();
  const { kpis, kpisLoading } = useGetKpis();

  const [trainers, setTrainers] = useState([]);
  const [trainerTargets, setTrainerTargets] = useState({});
  const [trainerTargetIds, setTrainerTargetIds] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const deptTargetValue = currentDepartmentTarget?.targetValue || 0;

  const defaultValues = useMemo(
    () => ({
      deptTargetValue,
    }),
    [deptTargetValue]
  );

  const methods = useForm({
    resolver: yupResolver(
      Yup.object({
        deptTargetValue: Yup.number().typeError('Must be a number').required('Required'),
      })
    ),
    defaultValues,
  });

  const { handleSubmit, formState: { errors }, reset } = methods;

  // Fetch trainers and initialize target values (for create and edit)
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const { target, departmentId } = currentDepartmentTarget;
        if (!target?.branchId || !departmentId) return;

        const res = await axiosInstance.post('/trainers/by-branch-department', {
          branchId: target.branchId,
          departmentId,
        });

        const fetchedTrainers = res.data || [];
        setTrainers(fetchedTrainers);
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
      }
    };

    if (currentDepartmentTarget) {
      fetchTrainers();
    }
  }, [currentDepartmentTarget]);

  // Reset form default values
  useEffect(() => {
    if (currentDepartmentTarget) {
      reset(defaultValues);
    }
  }, [currentDepartmentTarget, defaultValues, reset]);

  // Initialize targets from currentDepartmentTarget if editing
  useEffect(() => {
    if (
      currentDepartmentTarget?.trainerTargets &&
      currentDepartmentTarget.trainerTargets.length > 0 &&
      trainers.length > 0 &&
      kpis.length > 0
    ) {
      const initialTargets = {};
      const idMap = {};

      trainers.forEach((trainer) => {
        initialTargets[trainer.id] = {};
        idMap[trainer.id] = {};
        kpis.forEach((kpi) => {
          initialTargets[trainer.id][kpi.id] = 0;
          idMap[trainer.id][kpi.id] = null;
        });
      });

      currentDepartmentTarget.trainerTargets.forEach((tt) => {
        const { trainerId, kpiId, targetValue, id } = tt;
        if (!initialTargets[trainerId]) initialTargets[trainerId] = {};
        if (!idMap[trainerId]) idMap[trainerId] = {};

        initialTargets[trainerId][kpiId] = targetValue;
        idMap[trainerId][kpiId] = id;
      });

      setTrainerTargets(initialTargets);
      setTrainerTargetIds(idMap);
    }
  }, [currentDepartmentTarget, trainers, kpis]);

  // Submit form
  const onSubmit = async () => {
    const trainerKpiTargetPayload = trainers.map((trainer) => ({
      trainerId: trainer.id,
      kpiTargets: kpis.map((kpi) => ({
        kpiId: kpi.id,
        targetValue: trainerTargets[trainer.id]?.[kpi.id] ?? 0,
        trainerTargetId: trainerTargetIds[trainer.id]?.[kpi.id] ?? undefined,
      })),
    }));

    try {
      await axiosInstance.post('/trainer-targets/assign', {
        departmentTargetId: currentDepartmentTarget.id,
        trainerKpiTargets: trainerKpiTargetPayload,
      });

      enqueueSnackbar('Trainer KPI targets saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Department Target"
                  value={deptTargetValue}
                  fullWidth
                  disabled
                  error={!!errors.deptTargetValue}
                  helperText={errors.deptTargetValue?.message}
                />
              </Grid>

              {errorMessage && (
                <Grid item xs={12}>
                  <Alert severity="error">{errorMessage}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Assign KPI Targets
                </Typography>

                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: kpis.length * 150 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Trainer</TableCell>
                        {kpis?.map((kpi) => (
                          <TableCell key={kpi.id}>{kpi.name}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {trainers.map((trainer) => (
                        <TableRow key={trainer.id}>
                          <TableCell>
                            {trainer.firstName} {trainer.lastName}
                          </TableCell>
                          {kpis.map((kpi) => (
                            <TableCell key={kpi.id}>
                              <TextField
                                type="number"
                                size="small"
                                value={trainerTargets[trainer.id]?.[kpi.id] ?? 0}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  setTrainerTargets((prev) => ({
                                    ...prev,
                                    [trainer.id]: {
                                      ...prev[trainer.id],
                                      [kpi.id]: value,
                                    },
                                  }));
                                }}
                                inputProps={{ min: 0 }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  Save Trainer KPI Targets
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

TargetNewEditAssignTrainerForm.propTypes = {
  currentDepartmentTarget: PropTypes.object.isRequired,
};
