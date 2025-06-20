import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
// utils
import { fData } from 'src/utils/format-number';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
// assets
import { countries } from 'src/assets/data';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSwitch,
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete,
  RHFSelect,
} from 'src/components/hook-form';
import { Chip, IconButton, InputAdornment, MenuItem } from '@mui/material';
import { states } from 'src/utils/constants';
import axiosInstance from 'src/utils/axios';
import { useBoolean } from 'src/hooks/use-boolean';
import { useGetBranchs } from 'src/api/branch';

// ----------------------------------------------------------------------

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const password = useBoolean();

  const { branches, branchesLoading, branchesEmpty, refreshBranches } = useGetBranchs();

  const [departments, setDepartments] = useState([]);

  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      email: Yup.string()
        .required('Email is required')
        .email('Email must be a valid email address'),
      country: Yup.string().required('Country is required'),
      password: !currentUser
        ? Yup.string()
            .min(6, 'Password must be at least 6 characters')
            .required('Password is required')
        : Yup.string(),
      confirmPassword: !currentUser
        ? Yup.string()
            .required('Confirm password is required')
            .oneOf([Yup.ref('password')], 'Passwords must match')
        : Yup.string(),
      phoneNumber: Yup.string()
        .required('Phone number is required')
        .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
      dob: Yup.string(),
      address: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      role: Yup.string().required('Role is required'),
      zipCode: Yup.string(),
      avatarUrl: Yup.mixed().nullable(),
      isActive: Yup.boolean(),
    })
  );
  const defaultValues = useMemo(
    () => ({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      role: currentUser?.permissions[0] || '',
      dob: currentUser?.dob || '',
      country: currentUser?.country || '',
      email: currentUser?.email || '',
      isActive: currentUser?.isActive ?? 1,
      avatarUrl: currentUser?.avatar?.fileUrl || null,
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
    resolver: yupResolver(validationSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const branch = watch('branch');
  const selectedDepartments = watch('departments');
  const values = watch();
  const role = watch('role');

  console.log(role);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      console.info('DATA', formData);

      const inputData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        permissions: [formData.role],
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        isActive: formData.isActive,
        dob: formData.dob,
        fullAddress: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      };
      if (formData.avatarUrl) {
        inputData.avatar = {
          fileUrl: formData.avatarUrl,
        };
      }
      if (formData.password) {
        inputData.password = formData.password;
      }
      if (!currentUser) {
        await axiosInstance.post('/register', inputData);
      } else {
        console.log('here');
        await axiosInstance.patch(`/api/users/${currentUser.id}`, inputData);
      }
      reset();
      enqueueSnackbar(currentUser ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
        variant: 'error',
      });
    }
  });

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/files', formData);
        const { data } = response;
        console.log(data);
        setValue('avatarUrl', data?.files[0].fileUrl, {
          shouldValidate: true,
        });
      }
    },
    [setValue]
  );

  useEffect(() => {
    if (role && role !== 'admin') {
      setValidationSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.object().required('Branch is required').nullable(),
            departments: Yup.array()
              .min(1, 'At least one department must be selected')
              .required('Departments are required'),
          })
        )
      );
    } else {
      setValidationSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            departments: Yup.array().notRequired(),
          })
        )
      );
    }
  }, [role]);

  useEffect(() => {
    if (branch && branch?.departments) {
      setValue('departments', []);
      setDepartments(branch.departments);
    }
  }, [branch, setValue]);

  useEffect(() => {
    if (role === 'admin') {
      setValue('branch', null);
      setValue('departments', []);
    }
  }, [role, setValue]);

  useEffect(() => {
    if (currentUser) {
      reset(defaultValues);
    }
  }, [currentUser, defaultValues, reset]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={(values.isActive && 'success') || (!values.isActive && 'error') || 'warning'}
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.isActive ? 'Active' : 'In-Active'}
              </Label>
            )}

            <Box sx={{ mb: 5 }}>
              <RHFUploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                onDrop={handleDrop}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>

            {currentUser && (
              <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                <Button variant="soft" color="error">
                  Delete User
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="firstName" label="First Name" />
              <RHFTextField name="lastName" label="Last Name" />
              <RHFTextField name="email" label="Email Address" />
              <RHFTextField type="number" name="phoneNumber" label="Phone Number" />

              {!currentUser ? (
                <>
                  <RHFTextField
                    name="password"
                    label="Password"
                    type={password.value ? 'text' : 'password'}
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={password.onToggle} edge="end">
                            <Iconify
                              icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <RHFTextField
                    name="confirmPassword"
                    label="Confirm New Password"
                    type={password.value ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={password.onToggle} edge="end">
                            <Iconify
                              icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              ) : null}

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
                {[
                  { value: 'admin', name: 'Admin' },
                  { value: 'hod', name: 'HOD' },
                  { value: 'salesman', name: 'Salesman' },
                ].map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.name}
                  </MenuItem>
                ))}
              </RHFSelect>
              {role && role !== 'admin' && (
                <>
                  <RHFAutocomplete
                    name="branch"
                    label="Branch"
                    options={branches || []}
                    getOptionLabel={(option) => `${option?.name}` || ''}
                    filterOptions={(x) => x}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <div>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {`${option?.name}`}
                          </Typography>
                        </div>
                      </li>
                    )}
                    renderTags={(selected, getTagProps) =>
                      selected.map((option, tagIndex) => (
                        <Chip
                          {...getTagProps({ index: tagIndex })}
                          key={option.id}
                          label={`${option.name}`}
                          size="small"
                          color="info"
                          variant="soft"
                        />
                      ))
                    }
                  />

                  <RHFAutocomplete
                    multiple
                    name="departments"
                    label="Departments"
                    options={departments || []}
                    getOptionLabel={(option) => `${option?.name}` || ''}
                    filterOptions={(x) => x}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <div>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {`${option?.name}`}
                          </Typography>
                        </div>
                      </li>
                    )}
                    renderTags={(selected, getTagProps) =>
                      selected.map((option, tagIndex) => (
                        <Chip
                          {...getTagProps({ index: tagIndex })}
                          key={option.id}
                          label={`${option.name}`}
                          size="small"
                          color="info"
                          variant="soft"
                        />
                      ))
                    }
                  />
                </>
              )}
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create User' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

UserNewEditForm.propTypes = {
  currentUser: PropTypes.object,
};
