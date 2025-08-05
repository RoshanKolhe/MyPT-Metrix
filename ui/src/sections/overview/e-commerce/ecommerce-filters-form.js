/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, IconButton, Tooltip } from '@mui/material';
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import { Controller, useForm } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import Iconify from 'src/components/iconify';

const EcommerceFiltersForm = ({
  showFilters,
  branches = [],
  filterValues = {},
  onFilterChange,
  setShowFilter,
}) => {
  const methods = useForm({
    defaultValues: filterValues,
  });

  const { control, watch, setValue } = methods;

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
  }, [kpis, startDate, endDate]);

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
          <FormProvider methods={methods}>
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
};

export default EcommerceFiltersForm;
