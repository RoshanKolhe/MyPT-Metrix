import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { RHFAutocomplete } from 'src/components/hook-form';

const EcommerceFiltersForm = ({
  branches = [],
  departmentOptions = [],
  kpiOptions = [],
  setDepartments,
  setKpiOptions,
  watch,
  setValue,
}) => {
  const selectedBranch = watch('branchId');
  const selectedDepartment = watch('departmentId');

  useEffect(() => {
    const branch = branches.find((b) => b.id === selectedBranch);
    if (branch) {
      setDepartments(branch.departments || []);
      setValue('departmentId', null);
      setValue('kpiIds', []);
    } else {
      setDepartments([]);
    }
  }, [branches, selectedBranch, setDepartments, setValue]);

  useEffect(() => {
    const department = departmentOptions.find((d) => d.id === selectedDepartment);
    if (department) {
      setKpiOptions(department.kpis || []);
      setValue('kpiIds', []);
    } else {
      setKpiOptions([]);
    }
  }, [departmentOptions, selectedDepartment, setKpiOptions, setValue]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <RHFAutocomplete
          name="branchId"
          label="Branch"
          options={branches}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <RHFAutocomplete
          name="departmentId"
          label="Department"
          options={departmentOptions}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <RHFAutocomplete
          multiple
          name="kpiIds"
          label="KPIs"
          options={kpiOptions}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value}
        />
      </Grid>
    </Grid>
  );
};

EcommerceFiltersForm.propTypes = {
  branches: PropTypes.array,
  departmentOptions: PropTypes.array,
  kpiOptions: PropTypes.array,
  setDepartments: PropTypes.func.isRequired,
  setKpiOptions: PropTypes.func.isRequired,
  watch: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
};

export default EcommerceFiltersForm;
