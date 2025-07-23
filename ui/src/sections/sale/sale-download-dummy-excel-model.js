import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useEffect, useMemo, useState } from 'react';
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
import axiosInstance from 'src/utils/axios';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { Chip, Typography } from '@mui/material';

// ----------------------------------------------------------------------

export default function SaleDownloadDummyExcelModel({ open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

  const [departments, setDepartments] = useState([]);

  const [kpis, setKpis] = useState([]);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches } = useGetBranchsWithFilter(encodedFilter);

  const NewSaleSchema = Yup.object().shape({
    branch: Yup.object().required('Branch is required'),
    department: Yup.object().required('Department is required'),
    kpi: Yup.object().required('KPI is required'),
  });

  const defaultValues = useMemo(
    () => ({
      branch: null,
      department: null,
      kpi: null,
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewSaleSchema),
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
  console.log('errors', errors);
  const selectedBranch = watch('branch');
  const selectedDepartment = watch('department');

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const payload = {
        branchId: formData.branch?.id,
        departmentId: formData.department?.id,
        kpiId: formData.kpi?.id,
      };

      const response = await axiosInstance.post('/export-template', payload, {
        responseType: 'blob', // Important for binary download
      });

      // Create a Blob and download the file
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      reset();
      onClose();
      enqueueSnackbar('Template downloaded successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error downloading template:', error);
      enqueueSnackbar('Failed to download template.', { variant: 'error' });
    }
  });

  useEffect(() => {
    if (selectedBranch) {
      const dept = selectedBranch.departments || [];
      setDepartments(dept);
      setValue('department', null); // reset department
      setValue('kpi', null); // reset kpi
      setKpis([]); // clear kpis
    } else {
      setDepartments([]);
      setValue('department', null);
      setValue('kpi', null);
      setKpis([]);
    }
  }, [selectedBranch, setValue]);

  // 🔁 When department changes
  useEffect(() => {
    if (selectedDepartment) {
      const kpiOptions = selectedDepartment.kpis || [];
      setKpis(kpiOptions);
      setValue('kpi', null); // reset kpi
    } else {
      setKpis([]);
      setValue('kpi', null);
    }
  }, [selectedDepartment, setValue]);

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
        <DialogTitle>Download Template</DialogTitle>

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
            <RHFAutocomplete
              name="kpi"
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
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Download
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

SaleDownloadDummyExcelModel.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
