import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Card, Grid, Typography, TextField, Button, Alert } from '@mui/material';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

export default function TargetNewEditAssignTrainerForm({ currentDepartmentTarget }) {
  const { enqueueSnackbar } = useSnackbar();

  const [trainers, setTrainers] = useState([]);
  const [trainerTargets, setTrainerTargets] = useState({});
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
        deptTargetValue: Yup.number()
          .typeError('Must be a number')
          .min(1, 'Must be 1 or greater')
          .required('Required'),
        // individual trainer validations will be handled below manually
      })
    ),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = methods;

  // ✅ Pre-fill trainers from trainerTargets (already included in currentDepartmentTarget)
  useEffect(() => {
    const trainerData = currentDepartmentTarget?.trainerTargets || [];

    const initializeTrainersFromTarget = () => {
      const allTrainers = trainerData.map((tt) => ({
        ...tt.trainer,
      }));

      const initialTargets = {};
      trainerData.forEach((tt) => {
        initialTargets[tt.trainer.id] = tt.targetValue;
      });

      setTrainers(allTrainers);
      setTrainerTargets(initialTargets);
    };

    const fetchTrainers = async () => {
      try {
        const { target, departmentId } = currentDepartmentTarget;

        if (!target?.branchId || !departmentId) return;

        const res = await axiosInstance.post('/trainers/by-branch-department', {
          branchId: target.branchId,
          departmentId,
        });

        const fetchedTrainers = res.data || [];

        // Initialize targets with 0
        const initialTargets = {};
        fetchedTrainers.forEach((trainer) => {
          initialTargets[trainer.id] = 0;
        });

        setTrainers(fetchedTrainers);
        setTrainerTargets(initialTargets);
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
      }
    };

    if (trainerData.length > 0) {
      initializeTrainersFromTarget();
    } else {
      fetchTrainers();
    }
  }, [currentDepartmentTarget]);

  // ✅ Submit handler with validation
  const onSubmit = async () => {
    const totalAssigned = Object.values(trainerTargets).reduce(
      (sum, val) => sum + Number(val || 0),
      0
    );

    const hasEmpty = Object.values(trainerTargets).some(
      (val) => val === '' || val === null || Number.isNaN(val)
    );

    if (hasEmpty) {
      setErrorMessage('All trainers must have a target value');
      return;
    }

    if (totalAssigned !== deptTargetValue) {
      enqueueSnackbar(
        `Total of trainer targets (${totalAssigned}) must exactly match department target (${deptTargetValue})`,
        { variant: 'error' }
      );

      return;
    }

    try {
      const payload = {
        departmentTargetId: currentDepartmentTarget.id,
        trainerTargets: trainers.map((trainer) => {
          const existing = currentDepartmentTarget.trainerTargets?.find(
            (tt) => tt.trainerId === trainer.id
          );
          return {
            trainerId: trainer.id,
            targetValue: Number(trainerTargets[trainer.id]),
            trainerTargetId: existing?.id, // include for update
          };
        }),
      };

      await axiosInstance.post('/trainer-targets/assign', payload);
      enqueueSnackbar('Trainer targets saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (currentDepartmentTarget) {
      reset(defaultValues);
    }
  }, [currentDepartmentTarget, defaultValues, reset]);

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <RHFTextField label="Department Target" name="deptTargetValue" disabled />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Assign Targets to Trainers
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {trainers.map((trainer) => (
                    <Grid item xs={12} sm={6} key={trainer.id}>
                      <Controller
                        name={`trainer_${trainer.id}`}
                        control={control}
                        defaultValue={trainerTargets[trainer.id] || ''}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={`${trainer.firstName} ${trainer.lastName}`}
                            type="number"
                            fullWidth
                            value={trainerTargets[trainer.id] || ''}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              setTrainerTargets((prev) => ({
                                ...prev,
                                [trainer.id]: value,
                              }));
                            }}
                            inputProps={{ min: 0, step: 1 }}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                <Button type="submit" variant="contained">
                  Save Trainer Targets
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
