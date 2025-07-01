import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { useRouter } from 'src/routes/hook';
import { paths } from 'src/routes/paths';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { LoadingButton } from '@mui/lab';

export default function TargetViewForm({ currentTarget }) {
  const { user } = useAuthContext();

  const isCGM = user?.permissions?.includes('cgm');
  const isSuperAdmin = user?.permissions?.includes('super_admin');
  const isHOD = user?.permissions?.includes('hod');
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const confirm = useBoolean();
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [kpiTargets, setKpiTargets] = useState({});

  const defaultValues = useMemo(() => {
    const kpiMap =
      currentTarget?.departmentTargets?.reduce((acc, dt) => {
        const key = `${dt.departmentId}_${dt.kpiId}`;
        acc[key] = dt.targetValue;
        return acc;
      }, {}) || {};

    setKpiTargets(kpiMap);

    return {
      branch: currentTarget?.branch || null,
      cgmUser: currentTarget?.cgmApproverUser || null,
      startDate: currentTarget?.startDate ? new Date(currentTarget.startDate) : null,
      endDate: currentTarget?.endDate ? new Date(currentTarget.endDate) : null,
      targetValue: currentTarget?.targetValue || 0,
      requestChangeReason: '',
      ...Object.entries(kpiMap).reduce((acc, [key, value]) => {
        acc[`kpi_${key}`] = value;
        return acc;
      }, {}),
    };
  }, [currentTarget]);

  const methods = useForm({ defaultValues });
  const { handleSubmit, control, setValue, reset } = methods;

  const handleApproveTarget = async () => {
    setLoading(true);
    try {
      const inputData = {
        status: 1,
      };
      await axiosInstance.patch(`/targets/${currentTarget.id}/status`, inputData);
      enqueueSnackbar('Target Approved Successfully');
      router.push(paths.dashboard.target.list);
    } catch (error) {
      console.error('Error saving user details:', error);
      enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTarget?.branch?.departments) {
      setDepartments(currentTarget.branch.departments);
    }
  }, [currentTarget]);

  const { branchTarget, serviceKpiTotal } = useMemo(() => {
    let sales = 0;
    let service = 0;

    departments.forEach((dept) => {
      (dept.kpis || []).forEach((kpi) => {
        const key = `${dept.id}_${kpi.id}`;
        const val = Number(kpiTargets[key] || 0);
        if (kpi.type === 'sales') sales += val;
        else if (kpi.type === 'service') service += val;
      });
    });

    return { branchTarget: sales, serviceKpiTotal: service };
  }, [kpiTargets, departments]);

  useEffect(() => {
    setValue('targetValue', branchTarget);
  }, [branchTarget, setValue]);

  const onRequestChange = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(`/targets/${currentTarget.id}`, {
        status: 2,
        requestChangeReason: data.requestChangeReason,
      });
      enqueueSnackbar('Request change sent');
      router.push(paths.dashboard.target.list);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Something went wrong', { variant: 'error' });
    }
  });

  const handleChangeRequest = async () => {
    setLoading(true);
    try {
      const inputData = {
        changeRequestReason: rejectReason,
        status: 2,
      };
      await axiosInstance.patch(`/targets/${currentTarget.id}/status`, inputData);
      enqueueSnackbar('Target Sent For Changes');
      setRejectError(false);
      confirm.onFalse();
      router.push(paths.dashboard.target.list);
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
        variant: 'error',
      });
      confirm.onFalse();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTarget) {
      reset(defaultValues);
    }
  }, [currentTarget, defaultValues, reset]);

  return (
    <FormProvider methods={methods} onSubmit={onRequestChange}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <RHFAutocomplete
                  name="branch"
                  label="Branch"
                  options={[currentTarget?.branch]}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFAutocomplete
                  name="cgmUser"
                  label="CGM User"
                  options={[currentTarget?.cgmApproverUser]}
                  getOptionLabel={(option) =>
                    `${option?.firstName || ''} ${option?.lastName || ''}`
                  }
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Start Date"
                      value={field.value}
                      onChange={field.onChange}
                      disabled
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="End Date"
                      value={field.value}
                      onChange={field.onChange}
                      disabled
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField name="targetValue" label="Branch Sales Target" disabled />
              </Grid>

              {departments.map((dept) => (
                <Grid item xs={12} key={dept.id}>
                  <Typography variant="subtitle2" gutterBottom>
                    {dept.name}
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    {(dept.kpis || []).length > 0 ? (
                      dept.kpis.map((kpi) => {
                        const key = `${dept.id}_${kpi.id}`;
                        return (
                          <Grid item xs={12} sm={6} key={kpi.id}>
                            <Controller
                              name={`kpi_${key}`}
                              control={control}
                              defaultValue=""
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label={kpi.name}
                                  type="number"
                                  fullWidth
                                  disabled
                                />
                              )}
                            />
                          </Grid>
                        );
                      })
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          No KPIs found for this department.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              ))}

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  {!isSuperAdmin && currentTarget && currentTarget?.status !== 1 && (
                    <Grid item>
                      <LoadingButton
                        color="error"
                        variant="contained"
                        loading={loading}
                        onClick={() => {
                          console.log('reject');
                          confirm.onTrue();
                        }}
                        disabled={currentTarget?.status !== 0}
                      >
                        Request Change
                      </LoadingButton>
                    </Grid>
                  )}
                  {!isSuperAdmin && currentTarget && currentTarget?.status !== 1 && (
                    <Grid item>
                      <LoadingButton
                        type="button"
                        variant="contained"
                        loading={loading}
                        disabled={currentTarget?.status !== 0}
                        onClick={() => {
                          handleApproveTarget();
                        }}
                      >
                        Approve Target
                      </LoadingButton>
                    </Grid>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>Wait! Let’s Talk Before You Decide.</span>
          </Stack>
        }
        content={
          <Stack spacing={2}>
            <span>Got concerns? Request a callback, and we will address them right away!</span>
            <TextField
              label="Reason for change request"
              variant="outlined"
              fullWidth
              multiline
              minRows={3}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(false);
              }}
              error={rejectError}
              helperText={rejectError ? 'Please provide a reason for change request.' : ''}
            />
          </Stack>
        }
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={loading}
            onClick={() => {
              if (!rejectReason.trim()) {
                setRejectError(true);
                // eslint-disable-next-line no-useless-return
                return;
              }
              handleChangeRequest();
            }}
          >
            Request Change
          </LoadingButton>
        }
      />
    </FormProvider>
  );
}

TargetViewForm.propTypes = {
  currentTarget: PropTypes.object,
};
