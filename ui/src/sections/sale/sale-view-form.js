/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Button, Chip, FormControl, FormHelperText, MenuItem, useTheme } from '@mui/material';
import { useRouter } from 'src/routes/hook';
import { useSnackbar } from 'notistack';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import Iconify from 'src/components/iconify';

const PAYMENT_OPTIONS = [
  { value: 'viya_app', label: 'ViyaApp Payment' },
  { value: 'mypt', label: 'MyPT App Payment' },
  { value: 'cash', label: 'Cash' },
  { value: 'pos', label: 'POS' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'link', label: 'Payment Link' },
  { value: 'tabby', label: 'Tabby' },
  { value: 'tamara', label: 'Tamara' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'atm', label: 'Bank/ATM Deposit' },
];

// ----------------------------------------------------------------------

export default function SaleViewForm({ currentSale }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();
  console.log(user);
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');
  const isCGM = user?.permissions?.includes('cgm');
  const isDepartmentUser =
    user?.permissions?.includes('hod') || user?.permissions?.includes('sub_hod');

  const shouldAutoAssignBranch = !currentSale && (isCGM || isDepartmentUser);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches } = useGetBranchsWithFilter(encodedFilter);

  const [departments, setDepartments] = useState([]);

  const [kpis, setKpis] = useState([]);

  const [trainers, setTrainers] = useState([]);
  const [salesTrainers, setSalesTrainers] = useState([]);
  const [serviceTrainers, setServiceTrainers] = useState([]);

  const [salesSchema, setSalesSchema] = useState(
    Yup.object().shape({
      email: Yup.string()
        .required('Email is required')
        .email('Email must be a valid email address'),
      memberName: Yup.string().required('Member name is required'),
      gender: Yup.string().required('Gender is required'),
      salesPerson: Yup.object().nullable().required('Sales person is required'),
      trainerName: Yup.object().nullable(),
      trainingAt: Yup.string().required('Training location is required'),
      memberType: Yup.string().required('Member type is required'),
      sourceOfLead: Yup.string(),
      contactNumber: Yup.string().required('Contact number is required'),
      membershipType: Yup.array().min(1, 'Select at least one membership type'),
      purchaseDate: Yup.date().required('Purchase date is required'),
      actualPrice: Yup.number()
        .typeError('Actual Price must be a number')
        .positive('Actual Price must be a positive number')
        .required(),
      discountedPrice: Yup.number()
        .typeError('Discounted Price must be a number')
        .positive('Discounted Price must be a positive number')
        .required('Discounted Price is required')
        .max(Yup.ref('actualPrice'), 'Discounted Price cannot be greater than Actual Price'),
      validityDays: Yup.number().typeError('Validity days are required').min(1).required(),
      freeDays: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .typeError('Free days must be a number')
        .min(0, 'Free days cannot be negative')
        .nullable(),

      numberOfFreeSessions: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .typeError('Free sessions must be a number')
        .min(0, 'Free sessions cannot be negative')
        .nullable(),
      startDate: Yup.date().required('Start date is required'),
      expiryDate: Yup.date()
        .required('Expiry date is required')
        .min(Yup.ref('startDate'), 'End date must be after start date'),
      freezingDays: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .typeError('Freezing days be a number')
        .min(0, 'Freezing days cannot be negative')
        .nullable(),
      paymentTypes: Yup.array()
        .of(
          Yup.object().shape({
            paymentMode: Yup.string().required('Payment Mode is required'),
            paymentReceiptNumber: Yup.string().required('Payment Receipt Number is required'),
            amount: Yup.number().required('Amount is required'),
          })
        )
        .min(1, 'At least one material is required'),
    })
  );

  const defaultValues = useMemo(
    () => ({
      department: currentSale?.department || null,
      branch: currentSale?.branch || null,
      kpis: currentSale?.kpi || null,
      memberName: currentSale?.memberName || '',
      gender: currentSale?.gender || '',
      salesPerson: currentSale?.salesTrainer || null,
      trainerName: currentSale?.trainer || null,
      trainingAt: currentSale?.trainingAt || '',
      memberType: currentSale?.memberType || '',
      sourceOfLead: currentSale?.sourceOfLead || '',
      contactNumber: currentSale?.contactNumber || '',
      email: currentSale?.email || '',
      membershipType: currentSale?.membershipDetails?.membershipType || [],
      purchaseDate: currentSale?.membershipDetails?.purchaseDate
        ? new Date(currentSale?.membershipDetails?.purchaseDate)
        : null,
      actualPrice: currentSale?.membershipDetails?.actualPrice || '',
      discountedPrice: currentSale?.membershipDetails?.discountedPrice || '',
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
      paymentTypes: currentSale?.paymentTypes?.length
        ? currentSale.paymentTypes.map((paymentType) => ({
            paymentMode: paymentType?.paymentMode || '',
            paymentReceiptNumber: paymentType?.paymentReceiptNumber || '',
            amount: paymentType?.amount || 0,
          }))
        : [
            {
              paymentMode: '',
              paymentReceiptNumber: '',
              amount: 0,
            },
          ],
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

  console.log(errors);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'paymentTypes',
  });

  const branch = watch('branch');
  const department = watch('department');
  const memberType = watch('memberType');
  const actualPrice = watch('actualPrice');
  const discountedPrice = watch('discountedPrice');
  const kpiData = watch('kpis');

  console.log(department);

  const discountPercentage =
    actualPrice && discountedPrice
      ? Math.round(((actualPrice - discountedPrice) / actualPrice) * 100)
      : null;

  const prevBranchRef = useRef(null);
  const prevDeptRef = useRef(null);

  const renderMaterialDetailsForm = (
    <Stack spacing={3} mt={3}>
      {fields.map((item, index) => {
        const selectedModes = fields
          .map((f, i) => (i !== index ? f.paymentMode : null))
          .filter(Boolean);

        const availableOptions = PAYMENT_OPTIONS.filter(
          (opt) => !selectedModes.includes(opt.value)
        );

        return (
          <Stack key={item.id} alignItems="flex-end" spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
              <RHFSelect
                name={`paymentTypes[${index}].paymentMode`}
                label="Mode of Payment"
                disabled
              >
                {availableOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFTextField
                name={`paymentTypes[${index}].paymentReceiptNumber`}
                label="Payment Receipt Number"
                disabled
              />

              <RHFTextField name={`paymentTypes[${index}].amount`} label="Amount" disabled />
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );

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
      setValue('kpis', null);
      setValue('salesPerson', null);
      setValue('trainerName', null);

      setDepartments([]);
      setKpis([]);
      setSalesTrainers([]);
      setServiceTrainers([]);
    }

    // ✅ Only update departments from branch if user is NOT a department user
    if (!isDepartmentUser) {
      setDepartments(branch?.departments || []);
    }

    prevBranchRef.current = branch;
  }, [branch, setValue, isDepartmentUser]);

  useEffect(() => {
    if (!currentSale && isDepartmentUser && user?.departments?.length > 0) {
      setDepartments(user.departments);
    }
  }, [user?.departments, isDepartmentUser, currentSale]);

  useEffect(() => {
    const prevDept = prevDeptRef.current;

    const isDeptChanged = prevDept && department && prevDept.id !== department.id;
    const isDeptCleared = prevDept && !department;

    if (isDeptChanged || isDeptCleared) {
      console.log('here');
      setValue('salesPerson', null);
      setValue('trainerName', null);
      setValue('kpis', null);

      setSalesTrainers([]);
      setServiceTrainers([]);
      setKpis([]);
    }

    // Set KPIs from department
    if (department?.kpis) {
      setKpis(department.kpis);
    } else {
      setKpis([]); // Clear KPIs if no department
    }

    prevDeptRef.current = department;
  }, [department, setValue]);

  useEffect(() => {
    if (shouldAutoAssignBranch && user?.branch) {
      const userBranch = branches?.find((b) => b.id === user.branch.id);
      if (userBranch) {
        setValue('branch', userBranch);
      }
    }
  }, [shouldAutoAssignBranch, user?.branch, branches, setValue]);

  useEffect(() => {
    if (isSuperOrAdmin) {
      setSalesSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.object().required('Branch is required'),
            department: Yup.object().required('Department is required'),
            kpis: Yup.object().required('Kpi is required'),
          })
        )
      );
    } else if (isCGM) {
      setSalesSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.object().required('Department is required'),
            kpis: Yup.object().required('Kpi is required'),
          })
        )
      );
    } else {
      setSalesSchema((prev) =>
        prev.concat(
          Yup.object().shape({
            branch: Yup.mixed().notRequired(),
            department: Yup.mixed().notRequired(),
            kpis: Yup.object().notRequired(),
          })
        )
      );
    }
  }, [isCGM, isSuperOrAdmin, user?.permissions]);

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

  useEffect(() => {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(isDark ? 'dark-mode' : 'light-mode');
  }, [isDark]);

  return (
    <FormProvider methods={methods}>
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
                  disabled
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
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFAutocomplete
                  name="kpis"
                  label="KPI"
                  options={kpis || []}
                  getOptionLabel={(option) => `${option?.name}` || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  filterOptions={(options, state) =>
                    options.filter((option) =>
                      option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                    )
                  }
                  renderOption={(props, option) => {
                    const newProps = {
                      ...props,
                      key: option.id || option.name, // Ensure uniqueness
                    };

                    return (
                      <li {...newProps}>
                        <div>
                          <Typography variant="subtitle2">{option?.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option?.type}
                          </Typography>
                        </div>
                      </li>
                    );
                  }}
                  disabled
                />
              </Grid>
            </Grid>
            <Typography variant="h6" gutterBottom mt={2}>
              Member Details
            </Typography>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="memberName" label="Member Name" disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="contactNumber"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Contact number is required' }}
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
                              color: error
                                ? '#f44336'
                                : isDark
                                ? '#fff'
                                : theme.palette.text.secondary,
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
                        disabled
                      />

                      {error && <FormHelperText>{error.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="email" label="Email Address" disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect name="gender" label="Gender" disabled>
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
                  disabled
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
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect name="trainingAt" label="Training At" disabled>
                  <MenuItem value="academy">Academy</MenuItem>
                  <MenuItem value="ladies">Ladies Gym</MenuItem>
                  <MenuItem value="mixed">Mixed Section</MenuItem>
                  <MenuItem value="home">Home Training</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </RHFSelect>
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFSelect name="memberType" label="Member Type" disabled>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="rnl">RNL</MenuItem>
                  <MenuItem value="upgrade">Upgrade</MenuItem>
                  <MenuItem value="top_up">Top up</MenuItem>
                  <MenuItem value="emi">EMI collection</MenuItem>
                  <MenuItem value="viya_fit">Viya Fit</MenuItem>
                </RHFSelect>
              </Grid>
              {memberType === 'new' ? (
                <Grid item xs={12} sm={6}>
                  <RHFSelect name="sourceOfLead" label="Source of Lead" disabled>
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
                    { label: 'Academy', value: 'academy' },
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
                  disabled
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
                      disabled
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="actualPrice" label="Actual Price" type="number" disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField
                  name="discountedPrice"
                  label={
                    discountPercentage !== null
                      ? `Discounted Price (-${discountPercentage}%)`
                      : 'Discounted Price'
                  }
                  type="number"
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <RHFTextField name="validityDays" label="Validity Days" type="number" disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="freeDays" label="Free Days" type="number" disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField
                  name="numberOfFreeSessions"
                  label="Free Sessions"
                  type="number"
                  disabled
                />
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
                      disabled
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
                      disabled
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <RHFTextField name="freezingDays" label="Freezing Days" type="number" disabled />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                {renderMaterialDetailsForm}
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

SaleViewForm.propTypes = {
  currentSale: PropTypes.object,
};
