import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFAutocomplete, RHFSelect, RHFTextField } from 'src/components/hook-form';
import { COMMON_STATUS_OPTIONS } from 'src/utils/constants';
import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function ConductionQuickEditForm({
  currentConduction,
  open,
  onClose,
  refreshConductions,
}) {
  console.log(currentConduction);
  const { enqueueSnackbar } = useSnackbar();

  const NewConductionSchema = Yup.object().shape({
    conductionDate: Yup.date().required('Conduction Date is required'),
    conductions: Yup.number()
      .transform((value, originalValue) =>
        String(originalValue).trim() === '' ? undefined : value
      )
      .typeError('Conduction value must be a number')
      .required('Value is required')
      .min(0, 'Value must be 0 or more'),
    trainer: Yup.object().nullable().required('Trainer is required'),
    kpi: Yup.object().nullable().required('KPI is required'),
    branch: Yup.object().nullable().required('Branch is required'),
    department: Yup.object().nullable().required('Department is required'),
  });

  const defaultValues = useMemo(
    () => ({
      conductionDate: currentConduction?.conductionDate
        ? new Date(currentConduction.conductionDate)
        : null,
      conductions: currentConduction?.conductions || '',
      trainer: currentConduction?.trainer || null,
      kpi: currentConduction?.kpi || null,
      branch: currentConduction?.branch || null,
      department: currentConduction?.department || null,
    }),
    [currentConduction]
  );

  const methods = useForm({
    resolver: yupResolver(NewConductionSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const payload = {
        conductionDate: formData.conductionDate,
        conductions: Number(formData.conductions),
        trainerId: formData.trainer.id,
        kpiId: formData.kpi.id,
        branchId: formData.branch.id,
        departmentId: formData.department.id,
      };

      await axiosInstance.patch(`/conductions/${currentConduction.id}`, payload);

      refreshConductions();
      reset();
      onClose();
      enqueueSnackbar('Update success!');
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Update</DialogTitle>

        <DialogContent>
          <Box
            mt={2}
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <Controller
              name="conductionDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Conduction Date"
                  value={field.value}
                  onChange={(newValue) => field.onChange(newValue)}
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

            <RHFTextField name="conductions" label="Conductions" type="number" />

            <RHFAutocomplete
              name="trainer"
              label="Trainer"
              options={[currentConduction?.trainer]}
              getOptionLabel={(option) => `${option?.firstName || ''} ${option?.lastName || ''}`}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              disabled
            />

            <RHFAutocomplete
              name="kpi"
              label="KPI"
              options={[currentConduction?.kpi]}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              disabled
            />

            <RHFAutocomplete
              name="branch"
              label="Branch"
              options={[currentConduction?.branch]}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              disabled
            />

            <RHFAutocomplete
              name="department"
              label="Department"
              options={[currentConduction?.department]}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              disabled
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

ConductionQuickEditForm.propTypes = {
  currentConduction: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  refreshConductions: PropTypes.func,
};
