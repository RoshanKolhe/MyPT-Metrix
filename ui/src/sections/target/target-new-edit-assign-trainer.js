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

export default function TargetNewEditAssignTrainerForm({ currentDepartmentTarget }) {
  const { enqueueSnackbar } = useSnackbar();

  const [kpis, setKpis] = useState([]);
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

  const {
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  const onSubmit = async () => {
    try {
      const trainerKpiTargetPayload = trainers.map((trainer) => ({
        trainerId: trainer.id,
        kpiTargets: kpis.map((kpi) => {
          const key = `${kpi.id}_${kpi.departmentTargetId}`;

          return {
            kpiId: kpi.id,
            departmentTargetId: kpi.departmentTargetId,
            targetValue: trainerTargets[trainer.id]?.[key] ?? 0,
            trainerTargetId: trainerTargetIds[trainer.id]?.[key] ?? undefined,
          };
        }),
      }));
      console.log('trainerKpiTargetPayload', trainerKpiTargetPayload);
      await axiosInstance.post('/trainer-targets/assign', {
        trainerKpiTargets: trainerKpiTargetPayload,
      });

      enqueueSnackbar('Trainer KPI targets saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  // Fetch trainers and initialize target values (for create and edit)
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const { target, department } = currentDepartmentTarget;
        console.log(target, department);
        if (!target?.branchId || !department?.id) return;

        const res = await axiosInstance.post('/trainers/by-branch-department', {
          branchId: target.branchId,
          departmentId: department?.id,
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
    if (currentDepartmentTarget?.departmentTargets) {
      const kpisFromTarget = currentDepartmentTarget.departmentTargets.map((dt) => ({
        id: dt.kpi.id,
        name: dt.kpi.name,
        targetValue: dt.targetValue,
        departmentTargetId: dt.id,
      }));

      setKpis(kpisFromTarget);
    }
  }, [currentDepartmentTarget]);

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Assign Trainer Targets
                </Typography>

                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: kpis.length * 150 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Trainer</TableCell>
                        {kpis.map((kpi) => (
                          <TableCell key={kpi.id}>
                            {kpi.name}
                            <Typography component="span" color="text.secondary">
                              ({kpi.targetValue})
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {trainers.map((trainer) => (
                        <TableRow key={trainer.id}>
                          <TableCell>
                            {trainer.firstName} {trainer.lastName}
                          </TableCell>
                          {kpis.map((kpi) => {
                            const key = `${kpi.id}_${kpi.departmentTargetId}`; // ✅ must be declared here

                            return (
                              <TableCell key={key}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  value={trainerTargets[trainer.id]?.[key] ?? 0}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setTrainerTargets((prev) => ({
                                      ...prev,
                                      [trainer.id]: {
                                        ...prev[trainer.id],
                                        [key]: value,
                                      },
                                    }));
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
