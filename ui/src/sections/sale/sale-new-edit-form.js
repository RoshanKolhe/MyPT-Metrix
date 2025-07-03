/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Chip, MenuItem } from '@mui/material';
import { useRouter } from 'src/routes/hook';
import { useSnackbar } from 'notistack';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function SaleNewEditForm({ currentSale }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches } = useGetBranchsWithFilter(encodedFilter);

  const [departments, setDepartments] = useState([]);

  const [trainers, setTrainers] = useState([]);
  const [salesTrainers, setSalesTrainers] = useState([]);
  const [serviceTrainers, setServiceTrainers] = useState([]);

  const [salesSchema, setSalesSchema] = useState(
    Yup.object().shape({
      memberName: Yup.string().required('Member name is required'),
      gender: Yup.string().required('Gender is required'),
      salesPerson: Yup.object().nullable().required('Sales person is required'),
      trainerName: Yup.object().nullable().required('Trainer name is required'),
      trainingAt: Yup.string().required('Training location is required'),
      memberType: Yup.string().required('Member type is required'),
      sourceOfLead: Yup.string(),
      contractNumber: Yup.string().required('Contract number is required'),
      membershipType: Yup.array().min(1, 'Select at least one membership type'),
      purchaseDate: Yup.date().required('Purchase date is required'),
      price: Yup.number().typeError('Price must be a number').positive().required(),
      validityDays: Yup.number().typeError('Validity days are required').min(1).required(),
      freeDays: Yup.number().typeError('Free days are required').min(0).required(),
      numberOfFreeSessions: Yup.number().typeError('Free sessions are required').min(0).required(),
      startDate: Yup.date().required('Start date is required'),
      expiryDate: Yup.date()
        .required('Expiry date is required')
        .min(Yup.ref('startDate'), 'End date must be after start date'),
      freezingDays: Yup.number().typeError('Freezing days are required').min(0).required(),
      paymentMode: Yup.string().required('Payment mode is required'),
      paymentReceiptNumber: Yup.string().required('Receipt number is required'),
    })
  );

  const defaultValues = useMemo(
    () => ({
      department: currentSale?.department || null,
      branch: currentSale?.branch || null,
      memberName: currentSale?.memberName || '',
      gender: currentSale?.gender || '',
      salesPerson: currentSale?.salesTrainer || null,
      trainerName: currentSale?.trainer || null,
      trainingAt: currentSale?.trainingAt || '',
      memberType: currentSale?.memberType || '',
      sourceOfLead: currentSale?.sourceOfLead || '',
      contractNumber: currentSale?.contractNumber || '',
      membershipType: currentSale?.membershipDetails?.membershipType || [],
      purchaseDate: currentSale?.membershipDetails?.purchaseDate
        ? new Date(currentSale?.membershipDetails?.purchaseDate)
        : null,
      price: currentSale?.membershipDetails?.price || '',
      validityDays: currentSale?.membershipDetails?.validityDays || '',
      freeDays: currentSale?.membershipDetails?.freeDays || '',
      numberOfFreeSessions: currentSale?.membershipDetails?.freeSessions || '',
      startDate: currentSale?.membershipDetails?.startDate
        ? new Date(currentSale?.membershipDetails?.startDate)
        : null,
      expiryDate: currentSale?.membershipDetails?.expiryDate
        ? new Date(currentSale?.membershipDetails?.expiryDate)
        : null,
      freezingDays: currentSale?.membershipDetails?.freezingDays || '',
      paymentMode: currentSale?.paymentMode || '',
      paymentReceiptNumber: currentSale?.paymentReceiptNumber || '',
    }),
    [currentSale]
  );

  const methods = useForm({
    resolver: yupResolver(salesSchema),
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

  const branch = watch('branch');
  const department = watch('department');
  const memberType = watch('memberType');

  const prevBranchRef = useRef(null);
  const prevDeptRef = useRef(null);

  const onSubmit = handleSubmit(async (formData) => {
    // handle create or update
    const inputData = {
      memberName: formData.memberName,
      gender: formData.gender,
      departmentId: formData.department?.id || null,
      branchId: formData.branch.id,
      salesTrainerId: formData.salesPerson.id,
      trainerId: formData.trainerName.id,
      trainingAt: formData.trainingAt,
      memberType: formData.memberType,
      sourceOfLead: formData.sourceOfLead,
      contractNumber: formData.contractNumber,
      paymentMode: formData.paymentMode,
      paymentReceiptNumber: formData.paymentReceiptNumber,
      membershipDetails: {
        membershipType: formData.membershipType,
        purchaseDate: formData.purchaseDate,
        price: formData.price,
        validityDays: formData.validityDays,
        freeDays: formData.freeDays,
        freeSessions: formData.numberOfFreeSessions,
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
        freezingDays: formData.freezingDays,
      },
    };

    if (!currentSale) {
      await axiosInstance.post('/sales', inputData);
    } else {
      await axiosInstance.patch(`/sales/${currentSale.id}`, inputData);
    }
    reset();
    enqueueSnackbar(currentSale ? 'Update success!' : 'Create success!');
    router.push(paths.dashboard.sale.list);
  });

  useEffect(() => {
    setSalesSchema((prev) =>
      prev.shape({
        sourceOfLead:
          memberType === 'new'
            ? Yup.string().required('Source of lead is required')
            : Yup.string().notRequired(),
      })
    );
  }, [memberType]);

  useEffect(() => {
    if (currentSale) {
      reset(defaultValues);
    }
  }, [currentSale, defaultValues, reset]);

  useEffect(() => {
    const prevBranch = prevBranchRef.current;

    const isBranchChanged = prevBranch && branch && prevBranch.id !== branch.id;
    const isBranchCleared = prevBranch && !branch;

    if (isBranchChanged || isBranchCleared) {
      setValue('department', null);
      setDepartments([]);
      setValue('salesPerson', null);
      setValue('trainerName', null);
      setSalesTrainers([]);
      setServiceTrainers([]);
    }

    // update departments when branch changes
    setDepartments(branch?.departments || []);
    prevBranchRef.current = branch;
  }, [branch, setValue]);

  useEffect(() => {
    const prevDept = prevDeptRef.current;

    const isDeptChanged = prevDept && department && prevDept.id !== department.id;
    const isDeptCleared = prevDept && !department;

    if (isDeptChanged || isDeptCleared) {
      setValue('salesPerson', null);
      setValue('trainerName', null);
      setSalesTrainers([]);
      setServiceTrainers([]);
    }

    prevDeptRef.current = department;
  }, [department, setValue]);

  useEffect(() => {
    const isSuperOrAdmin =
      user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');
    const isCGM = user?.permissions?.includes('cgm');

    if (isSuperOrAdmin) {
      setSalesSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.object().required('Branch is required'),
            department: Yup.object().required('Department is required'),
          })
        )
      );
    } else if (isCGM) {
      setSalesSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.object().required('Department is required'),
          })
        )
      );
    } else {
      setSalesSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.mixed().notRequired(),
          })
        )
      );
    }
  }, [user?.permissions]);

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
    if (trainers.length > 0) {
      const sales = [];
      const service = [];
      trainers.forEach((trainer) => {
        const kpiTypes = trainer.department?.kpis?.map((kpi) => kpi.type) || [];

        if (kpiTypes.includes('sales')) {
          sales.push(trainer);
        }
        if (kpiTypes.includes('service')) {
          service.push(trainer);
        }
      });

      setSalesTrainers(sales);
      setServiceTrainers(service);
    } else {
      setSalesTrainers([]);
      setServiceTrainers([]);
    }
  }, [trainers]);

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
              Member Details
            </Typography>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="memberName" label="Member Name" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect name="gender" label="Gender">
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </RHFSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  name="salesPerson"
                  label="Sales Person"
                  options={salesTrainers}
                  getOptionLabel={(option) => `${option?.firstName} ${option?.lastName}` || ''}
                  filterOptions={(x) => x}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <Typography variant="subtitle2">
                          {`${option?.firstName} ${option?.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {option.email}
                        </Typography>
                      </div>
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
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  name="trainerName"
                  label="Trainer Name"
                  options={serviceTrainers}
                  getOptionLabel={(option) => `${option?.firstName} ${option?.lastName}` || ''}
                  filterOptions={(x) => x}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <Typography variant="subtitle2">
                          {`${option?.firstName} ${option?.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {option.email}
                        </Typography>
                      </div>
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
              <Grid item xs={12} sm={6}>
                <RHFSelect name="trainingAt" label="Training At">
                  <MenuItem value="ladies">Ladies Gym</MenuItem>
                  <MenuItem value="mixed">Mixed Section</MenuItem>
                  <MenuItem value="home">Home Training</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </RHFSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect name="memberType" label="Member Type">
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="rnl">RNL</MenuItem>
                </RHFSelect>
              </Grid>
              {memberType === 'new' ? (
                <Grid item xs={12} sm={6}>
                  <RHFSelect name="sourceOfLead" label="Source of Lead">
                    <MenuItem value="leads_update">Leads Update</MenuItem>
                    <MenuItem value="walkins">Walkins</MenuItem>
                    <MenuItem value="phoneins">Phoneins</MenuItem>
                    <MenuItem value="whatsa_app_direct">Whatsa app direct</MenuItem>
                    <MenuItem value="website_form">Website form</MenuItem>
                    <MenuItem value="google_ads">Google Ads</MenuItem>
                    <MenuItem value="meta_ads">Meta Ads</MenuItem>
                    <MenuItem value="insta_direct_message">Insta Direct message</MenuItem>
                    <MenuItem value="mypt_app">MyPT App</MenuItem>
                    <MenuItem value="referral">Referral</MenuItem>
                    <MenuItem value="outreach">Outreach</MenuItem>
                    <MenuItem value="other_source">Other Source</MenuItem>
                    <MenuItem value="total">Total</MenuItem>
                  </RHFSelect>
                </Grid>
              ) : null}
              <Grid item xs={12} sm={6}>
                <RHFTextField name="contractNumber" label="Contract Number" />
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid item xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Membership Details
            </Typography>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  multiple
                  name="membershipType"
                  label="Membership Type"
                  options={[
                    { label: 'Gym Membership', value: 'gym' },
                    { label: 'PT Membership', value: 'pt' },
                    { label: 'Home Membership', value: 'home' },
                    { label: 'Reformer Pilates', value: 'reformer' },
                    { label: 'EMS Only', value: 'ems' },
                    { label: 'Group Ex Only', value: 'group' },
                    { label: 'Others', value: 'others' },
                  ]}
                  getOptionLabel={(option) => `${option?.label}` || ''}
                  filterOptions={(options, state) =>
                    options.filter((option) =>
                      option.label.toLowerCase().includes(state.inputValue.toLowerCase())
                    )
                  }
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <Typography variant="subtitle2">{`${option?.label}`}</Typography>
                      </div>
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, tagIndex) => (
                      <Chip
                        {...getTagProps({ index: tagIndex })}
                        key={option.value}
                        label={`${option.label}`}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    ))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="purchaseDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Purchase Date"
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
              <Grid item xs={12} sm={6}>
                <RHFTextField name="price" label="Price" type="number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="validityDays" label="Validity Days" type="number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="freeDays" label="Free Days" type="number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="numberOfFreeSessions" label="Free Sessions" type="number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Start Date"
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
              <Grid item xs={12} sm={6}>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Expiry Date"
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
              <Grid item xs={12} sm={6}>
                <RHFTextField name="freezingDays" label="Freezing Days" type="number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect name="paymentMode" label="Mode of Payment">
                  <MenuItem value="mypt">MyPT App Payment</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="pos">POS</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                  <MenuItem value="link">Payment Link</MenuItem>
                  <MenuItem value="tabby">Tabby</MenuItem>
                  <MenuItem value="tamara">Tamara</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="atm">Bank/ATM Deposit</MenuItem>
                </RHFSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="paymentReceiptNumber" label="Payment Receipt Number" />
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid item xs={12} md={12}>
          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {currentSale ? 'Update Sale' : 'Create Sale'}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

SaleNewEditForm.propTypes = {
  currentSale: PropTypes.object,
};
