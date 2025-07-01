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
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import { COMMON_STATUS_OPTIONS } from 'src/utils/constants';
import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function SaleQuickEditForm({ currentSale, open, onClose, refreshSales }) {
  console.log(currentSale);
  const { enqueueSnackbar } = useSnackbar();

  const NewSaleSchema = Yup.object().shape({
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string().required('Last Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phoneNumber: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    dob: Yup.string(),
    avatarUrl: Yup.mixed().nullable(),
    isActive: Yup.boolean(),
  });

  const defaultValues = useMemo(
    () => ({
      firstName: currentSale?.firstName || '',
      lastName: currentSale?.lastName || '',
      dob: currentSale?.dob || '',
      email: currentSale?.email || '',
      isActive: currentSale?.isActive ? '1' : '0' || '',
      avatarUrl: currentSale?.avatar?.fileUrl || null,
      phoneNumber: currentSale?.phoneNumber || '',
      department: currentSale?.department || null,
      branch: currentSale?.branch || null,
    }),
    [currentSale]
  );

  const methods = useForm({
    resolver: yupResolver(NewSaleSchema),
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
      const inputData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        isActive: formData.isActive,
        dob: formData.dob,
      };
      await axiosInstance.patch(`/trainers/${currentSale.id}`, inputData);
      refreshSales();
      reset();
      onClose();
      enqueueSnackbar('Update success!');
      console.info('DATA', formData);
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
          {!currentSale?.isActive && (
            <Alert variant="outlined" severity="error" sx={{ mb: 3 }}>
              Trainer is In-Active
            </Alert>
          )}

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
            <RHFSelect name="isActive" label="Status">
              {COMMON_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </RHFSelect>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

            <RHFTextField name="firstName" label="First Name" />
            <RHFTextField name="lastName" label="Last Name" />
            <RHFTextField name="email" label="Email Address" />
            <RHFTextField type="number" name="phoneNumber" label="Phone Number" />

            <Controller
              name="dob"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="DOB"
                  value={new Date(field.value)}
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

SaleQuickEditForm.propTypes = {
  currentSale: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  refreshSales: PropTypes.func,
};
