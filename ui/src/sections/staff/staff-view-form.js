/* eslint-disable no-nested-ternary */
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
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
// utils
import { fData } from 'src/utils/format-number';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
// components
import Label from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete,
} from 'src/components/hook-form';
import { Chip } from '@mui/material';
import axiosInstance from 'src/utils/axios';
import { useGetBranchs } from 'src/api/branch';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function StaffViewForm({ currentStaff }) {
  const { user } = useAuthContext();
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { branches } = useGetBranchs();

  const [departments, setDepartments] = useState([]);

  const [reportingUserOptions, setReportingUserOptions] = useState([]);

  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      email: Yup.string()
        .required('Email is required')
        .email('Email must be a valid email address'),
      phoneNumber: Yup.string()
        .required('Phone number is required')
        .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
      dob: Yup.string(),
      avatarUrl: Yup.mixed().nullable(),
      isActive: Yup.boolean(),
    })
  );
  const defaultValues = useMemo(
    () => ({
      firstName: currentStaff?.firstName || '',
      lastName: currentStaff?.lastName || '',
      dob: currentStaff?.dob || '',
      email: currentStaff?.email || '',
      isActive: currentStaff?.isActive ?? 1,
      avatarUrl: currentStaff?.avatar?.fileUrl || null,
      phoneNumber: currentStaff?.phoneNumber || '',
      department: currentStaff?.department || null,
      branch: currentStaff?.branch || null,
      reportingUser: currentStaff?.supervisor || null,
    }),
    [currentStaff]
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
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  console.log(errors);

  const branch = watch('branch');
  const department = watch('department');
  const values = watch();

  const onSubmit = handleSubmit(async (formData) => {
    try {
      console.info('DATA', formData);
      const inputData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        isActive: formData.isActive,
        dob: formData.dob,
      };
      if (formData.avatarUrl) {
        inputData.avatar = {
          fileUrl: formData.avatarUrl,
        };
      }
      if (formData.branch && formData.branch.id) {
        inputData.branchId = formData.branch.id;
      }
      if (formData.department?.id) {
        inputData.departmentId = formData.department.id;
      }
      if (formData.reportingUser?.id) {
        inputData.supervisorId = formData.reportingUser.id;
      }

      console.log(inputData);

      if (!currentStaff) {
        await axiosInstance.post('/staffs', inputData);
      } else {
        console.log('here');
        await axiosInstance.patch(`/staffs/${currentStaff.id}`, inputData);
      }
      reset();
      enqueueSnackbar(currentStaff ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.staff.list);
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

  const fetchReportingUsers = async (branchId, departmentId) => {
    try {
      const response = await axiosInstance.post('/users/by-branch-department', {
        branchId,
        departmentId,
      });
      setReportingUserOptions(response.data);
    } catch (error) {
      console.error('Failed to fetch reporting users:', error);
      setReportingUserOptions([]);
    }
  };
  useEffect(() => {
    const branchId = branch?.id;
    const departmentId = department?.id;

    const isEditing = !!currentStaff?.id;

    if (branchId && departmentId) {
      fetchReportingUsers(branchId, departmentId).then(() => {
        if (isEditing && currentStaff?.supervisor) {
          setValue('reportingUser', currentStaff.supervisor);
        }
      });
    } else {
      setReportingUserOptions([]);
      setValue('reportingUser', null);
    }
  }, [branch, department, setValue, currentStaff]);

  useEffect(() => {
    const isSuperOrAdmin =
      user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');
    const isCGM = user?.permissions?.includes('cgm');

    if (isSuperOrAdmin) {
      setValidationSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.object().required('Branch is required'),
            department: Yup.object().required('Department is required'),
            reportingUser: Yup.object().required('Reporting User is required'),
          })
        )
      );
    } else if (isCGM) {
      setValidationSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.object().required('Department is required'),
            reportingUser: Yup.object().required('Reporting User is required'),
          })
        )
      );
    } else {
      setValidationSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.mixed().notRequired(),
            reportingUser: Yup.object().notRequired(),
          })
        )
      );
    }
  }, [user?.permissions]);

  useEffect(() => {
    if (!branch) {
      setDepartments([]);
      setValue('departments', []);
      return;
    }

    const fetchedDepartments = branch?.departments || [];

    setDepartments(fetchedDepartments);

    if (!currentStaff) {
      setValue('departments', []);
    }
  }, [branch, currentStaff, setValue]);

  useEffect(() => {
    if (currentStaff) {
      reset(defaultValues);
    }
  }, [currentStaff, defaultValues, reset]);

  useEffect(() => {
    if (
      (user?.permissions?.includes('hod') || user?.permissions?.includes('subhod')) &&
      user?.branch
    ) {
      setValue('branch', user.branch);
    }
  }, [setValue, user]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentStaff && (
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
                disabled
              />
            </Box>
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
              <RHFTextField name="firstName" label="First Name" disabled />
              <RHFTextField name="lastName" label="Last Name" disabled />
              <RHFTextField name="email" label="Email Address" disabled />
              <RHFTextField type="number" name="phoneNumber" label="Phone Number" disabled />

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
                    disabled
                  />
                )}
              />
              <>
                {user?.permissions?.includes('admin') ||
                user?.permissions?.includes('super_admin') ||
                user?.permissions?.includes('cgm') ? (
                  <>
                    {/* Branch Select */}
                    <RHFAutocomplete
                      name="branch"
                      label="Branch"
                      options={branches || []}
                      getOptionLabel={(option) => `${option?.name}` || ''}
                      filterOptions={(x) => x}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography variant="subtitle2">{option?.name}</Typography>
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
                      disabled
                    />

                    {/* Department Select */}
                    <RHFAutocomplete
                      name="department"
                      label="Department"
                      options={departments || []}
                      getOptionLabel={(option) => `${option?.name}` || ''}
                      filterOptions={(x) => x}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography variant="subtitle2">{option?.name}</Typography>
                        </li>
                      )}
                    />

                    {/* Reporting User Select */}
                    {branch?.id && department?.id && (
                      <RHFAutocomplete
                        name="reportingUser"
                        label="Reporting User"
                        options={reportingUserOptions}
                        getOptionLabel={(option) =>
                          `${option?.firstName} ${option?.lastName}` || ''
                        }
                        filterOptions={(x) => x}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
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
                        disabled
                      />
                    )}
                  </>
                ) : user?.permissions?.includes('hod') || user?.permissions?.includes('subhod') ? (
                  <>
                    {/* Branch Disabled & Pre-selected */}
                    <RHFAutocomplete
                      name="branch"
                      label="Branch"
                      options={branches || []}
                      getOptionLabel={(option) => `${option?.name}` || ''}
                      filterOptions={(x) => x}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography variant="subtitle2">{option?.name}</Typography>
                        </li>
                      )}
                      disabled
                    />

                    {/* Department Fixed to User's Department */}
                    <RHFAutocomplete
                      name="department"
                      label="Department"
                      options={user?.departments ? user.departments : []}
                      getOptionLabel={(option) => `${option?.name}` || ''}
                      filterOptions={(x) => x}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography variant="subtitle2">{option?.name}</Typography>
                        </li>
                      )}
                      disabled
                    />

                    {/* Reporting User Select */}
                    {branch?.id && department?.id && (
                      <RHFAutocomplete
                        name="reportingUser"
                        label="Reporting User"
                        options={reportingUserOptions}
                        getOptionLabel={(option) =>
                          `${option?.firstName} ${option?.lastName}` || ''
                        }
                        filterOptions={(x) => x}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
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
                        disabled
                      />
                    )}
                  </>
                ) : null}
              </>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

StaffViewForm.propTypes = {
  currentStaff: PropTypes.object,
};
