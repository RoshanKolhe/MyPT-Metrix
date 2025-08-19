/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, IconButton, Tooltip } from '@mui/material';
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import { Controller, useForm } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import Iconify from 'src/components/iconify';
import { LoadingButton } from '@mui/lab';
import { countries } from 'src/assets/data';

const EcommerceFiltersForm = ({
  showFilters,
  branches = [],
  filterValues = {},
  onFilterChange,
  setShowFilter,
  handleSubmitFiltersForm,
}) => {
  const methods = useForm({
    defaultValues: filterValues,
  });

  const { control, watch, setValue, handleSubmit } = methods;

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [kpiOptions, setKpiOptions] = useState([]);

  // Watch form fields
  const branch = watch('branch');
  console.log('branch', branch);
  const department = watch('department');
  console.log('department', department);
  const kpis = watch('kpis');
  console.log('kpis', kpis);
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const country = watch('country');

  const onSubmit = handleSubmit(async (formData) => {
    try {
      console.info('DATA', formData);
      handleSubmitFiltersForm(formData);
    } catch (error) {
      console.error(error);
    }
  });

  // Update department options on branch change
  useEffect(() => {
    if (branch?.departments) {
      setDepartmentOptions(branch.departments);
      setValue('department', null);
      setValue('kpis', []);
      onFilterChange?.({ branch, department: null, kpis: [], startDate, endDate });
    } else {
      setDepartmentOptions([]);
      setKpiOptions([]);
      setValue('department', '');
      setValue('kpis', []);
      onFilterChange?.({ branch: null, department: null, kpis: [], startDate, endDate });
    }
  }, [branch]);

  useEffect(() => {
    if (department?.kpis) {
      setKpiOptions(department.kpis);
      setValue('kpis', []);
      onFilterChange?.({ branch, department, kpis: [], startDate, endDate });
    }
  }, [department]);

  useEffect(() => {
    onFilterChange?.({ branch, department, kpis, startDate, endDate });
  }, [kpis]);

  useEffect(() => {
    onFilterChange?.({ branch, department, kpis, startDate, endDate });
  }, [kpis, startDate, endDate, country]);

  return (
    <Grid container spacing={2}>
      {/* Always show the icon, left-aligned */}
      <Grid item xs="auto">
        <Tooltip title={showFilters ? 'Hide Filters' : 'Show Filters'} placement="top" arrow>
          <IconButton
            onClick={() => {
              setShowFilter(!showFilters);
            }}
            size="large"
          >
            <Iconify
              icon={showFilters ? 'mdi:filter-off-outline' : 'mdi:filter-outline'}
              width={24}
              height={24}
            />
          </IconButton>
        </Tooltip>
      </Grid>

      {/* Show filter form only when showFilters is true */}
      {showFilters && (
        <Grid item xs={12}>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Start Date"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="End Date"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <RHFAutocomplete
                  size="small"
                  name="branch"
                  label="Branch"
                  options={branches}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <RHFAutocomplete
                  size="small"
                  name="department"
                  label="Department"
                  options={departmentOptions}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <RHFAutocomplete
                  size="small"
                  multiple
                  name="kpis"
                  label="KPIs"
                  options={kpiOptions}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <RHFAutocomplete
                  size="small"
                  name="country"
                  label="Country"
                  options={countries.map((countryData) => countryData.label)}
                  getOptionLabel={(option) => option}
                  renderOption={(props, option) => {
                    const { code, label, phone } = countries.filter(
                      (countryData) => countryData.label === option
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
              </Grid>

              <Grid item xs={12} md={3}>
                <LoadingButton type="submit" variant="contained">
                  Apply
                </LoadingButton>
              </Grid>
            </Grid>
          </FormProvider>
        </Grid>
      )}
    </Grid>
  );
};

EcommerceFiltersForm.propTypes = {
  branches: PropTypes.array.isRequired,
  showFilters: PropTypes.bool,
  filterValues: PropTypes.shape({
    branch: PropTypes.object,
    department: PropTypes.object,
    kpis: PropTypes.arrayOf(PropTypes.object),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
  onFilterChange: PropTypes.func,
  setShowFilter: PropTypes.func,
  handleSubmitFiltersForm: PropTypes.func,
};

export default EcommerceFiltersForm;
