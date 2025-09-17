import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { alpha, IconButton, Stack, Tooltip } from '@mui/material';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFUploadBox } from 'src/components/hook-form';
import axiosInstance from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import FileThumbnail from 'src/components/file-thumbnail';
import { varFade } from 'src/components/animate';
import { m } from 'framer-motion';

// ----------------------------------------------------------------------

export default function SaleImportExcelModel({ open, onClose, refreshSales }) {
  const { enqueueSnackbar } = useSnackbar();

  // ✅ Yup schema
  const NewSaleImportSchema = Yup.object().shape({
    file: Yup.mixed().nullable().required('File is required'),
  });

  // ✅ Default values
  const defaultValues = useMemo(
    () => ({
      file: null,
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewSaleImportSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  // ✅ Log only when errors exist
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
    }
  }, [errors]);

  const watchedFile = watch('file');

  // ✅ Handle file drop
  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('file', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  // ✅ Remove file
  const handleRemoveFile = useCallback(() => {
    setValue('file', null);
  }, [setValue]);

  // ✅ Submit form
  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);

      const response = await axiosInstance.post('/import-sales-template', formData);

      const { importedCount, skippedCount } = response.data;
      refreshSales();
      reset();
      onClose();

      enqueueSnackbar(`Import successful: ${importedCount} imported, ${skippedCount} skipped.`, {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error importing sales template:', error);
      enqueueSnackbar('Failed to import sales template.', { variant: 'error' });
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
        <DialogTitle>Import</DialogTitle>

        <DialogContent>
          <Box
            mt={2}
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(1, 1fr)',
            }}
          >
            {/* Upload Box */}
            <RHFUploadBox
              name="file"
              maxSize={3145728}
              accept={{
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-excel': ['.xls'],
                'text/csv': ['.csv'],
              }}
              onDrop={handleDrop}
              onDelete={handleRemoveFile}
            />

            {/* ✅ Show validation error */}
            {errors.file && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.file.message}
              </Alert>
            )}

            {/* Show file preview if file selected */}
            {watchedFile && (
              <Tooltip title={watchedFile.name} arrow>
                <Stack
                  key={watchedFile.name}
                  component={m.div}
                  {...varFade().inUp}
                  alignItems="center"
                  display="inline-flex"
                  justifyContent="start"
                  sx={{
                    m: 0.5,
                    width: 80,
                    height: 80,
                    borderRadius: 1.25,
                    overflow: 'hidden',
                    position: 'relative',
                    border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                  }}
                >
                  <FileThumbnail
                    file={watchedFile}
                    tooltip
                    imageView
                    sx={{ position: 'absolute' }}
                    imgSx={{ position: 'absolute' }}
                  />

                  <IconButton
                    size="small"
                    onClick={() => setValue('file', null)}
                    sx={{
                      p: 0.5,
                      top: 4,
                      right: 4,
                      position: 'absolute',
                      color: 'common.white',
                      bgcolor: (theme) => alpha(theme.palette.grey[900], 0.48),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72),
                      },
                    }}
                  >
                    <Iconify icon="mingcute:close-line" width={14} />
                  </IconButton>
                </Stack>
              </Tooltip>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Import
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

SaleImportExcelModel.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
  refreshSales: PropTypes.func,
};
