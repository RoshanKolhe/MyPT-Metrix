/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo } from 'react';
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
import { states, USER_STATUS_OPTIONS } from 'src/utils/constants';
import axiosInstance from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';
import { FormControl, FormHelperText, useTheme } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';


// ----------------------------------------------------------------------

const allRoles = [
  { value: 'super_admin', name: 'Super Admin' },
  { value: 'admin', name: 'Admin' },
  { value: 'cgm', name: 'CGM' },
  { value: 'hod', name: 'HOD' },
  { value: 'sub_hod', name: 'SUB HOD' },
];
export default function UserQuickEditForm({ currentUser, open, onClose, refreshUsers }) {
  console.log(currentUser);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { user } = useAuthContext();
  console.log(user);
  const userRole = user?.permissions?.[0];

  const roleOptions =
    userRole === 'hod'
      ? allRoles.filter((r) => r.value === 'sub_hod')
      : userRole === 'cgm'
      ? allRoles.filter((r) => r.value === 'hod' || r.value === 'sub_hod')
      : allRoles;

  const { enqueueSnackbar } = useSnackbar();

  const NewUserSchema = Yup.object().shape({
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string().required('Last Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phoneNumber: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{8,15}$/, 'Phone number must be between 8 and 15 digits'),
    dob: Yup.string(),
    address: Yup.string(),
    state: Yup.string(),
    city: Yup.string(),
    role: Yup.string().required('Role is required'),
    zipCode: Yup.string(),
    avatarUrl: Yup.mixed().nullable(),
    isActive: Yup.boolean(),
  });

  const defaultValues = useMemo(
    () => ({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      role: currentUser?.permissions[0] || '',
      dob: currentUser?.dob || '',
      email: currentUser?.email || '',
      isActive: currentUser?.isActive ? '1' : '0' || '',
      country: currentUser?.country || '',
      phoneNumber: currentUser?.phoneNumber || '',
      address: currentUser?.fullAddress || '',
      city: currentUser?.city || '',
      state: currentUser?.state || '',
      password: '',
      confirmPassword: '',
    }),
    [currentUser]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
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
        permissions: [formData.role],
        phoneNumber: formData.phoneNumber,
        isActive: formData.isActive,
        dob: formData.dob,
        fullAddress: formData.address,
        city: formData.city,
        state: formData.state,
      };
      await axiosInstance.patch(`/users/${currentUser.id}`, inputData);
      refreshUsers();
      reset();
      onClose();
      enqueueSnackbar('Update success!');
      console.info('DATA', formData);
    } catch (error) {
      console.error(error);
    }
  });

  useEffect(() => {
    console.log('here12');
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(isDark ? 'dark-mode' : 'light-mode');
  }, [isDark]);

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
          {!currentUser?.isActive && (
            <Alert variant="outlined" severity="error" sx={{ mb: 3 }}>
              Account is In-Active
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
              {USER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </RHFSelect>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

            <RHFTextField name="firstName" label="First Name" />
            <RHFTextField name="lastName" label="Last Name" />
            <RHFTextField name="email" label="Email Address" />
            <Controller
              name="phoneNumber"
              control={control}
              defaultValue=""
              rules={{ required: 'Phone number is required' }}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error}>
                  <PhoneInput
                    {...field}
                    value={field.value}
                    country="ae"
                    enableSearch
                    specialLabel={
                      <span
                        style={{
                          backgroundColor: 'transparent',
                          color: error ? '#f44336' : isDark ? '#fff' : theme.palette.text.secondary,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Phone Number
                      </span>
                    }
                    inputStyle={{
                      width: '100%',
                      height: '56px',
                      fontSize: '16px',
                      backgroundColor: 'transparent',
                      borderColor: error ? '#f44336' : '#c4c4c4',
                      borderRadius: '8px',
                      color: isDark ? '#fff' : undefined,
                      paddingLeft: '48px',
                      paddingRight: '40px',
                    }}
                    containerStyle={{ width: '100%' }}
                    onChange={(value) => field.onChange(value)}
                    inputProps={{
                      name: field.name,
                      required: true,
                    }}
                  />

                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />

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

            <RHFAutocomplete
              name="country"
              label="Country"
              options={countries.map((country) => country.label)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => {
                const { code, label, phone } = countries.filter(
                  (country) => country.label === option
                )[0];

                if (!label) {
                  return null;
                }

                return (
                  <li {...props} key={label}>
                    <Iconify
                      key={label}
                      icon={`circle-flags:${code.toLowerCase()}`}
                      width={28}
                      sx={{ mr: 1 }}
                    />
                    {label} ({code}) +{phone}
                  </li>
                );
              }}
            />

            <RHFTextField name="state" label="State/Region" />
            <RHFTextField name="city" label="City" />
            <RHFTextField name="address" label="Address" />
            <RHFSelect fullWidth name="role" label="Role">
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.name}
                </MenuItem>
              ))}
            </RHFSelect>
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

UserQuickEditForm.propTypes = {
  currentUser: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  refreshUsers: PropTypes.func,
};
