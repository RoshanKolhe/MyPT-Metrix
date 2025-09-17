import PropTypes from 'prop-types';
import { useCallback } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

// components
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, Grid } from '@mui/material';
import { useBoolean } from 'src/hooks/use-boolean';
import SaleDownloadDummyExcelModel from './sale-download-dummy-excel-model';
import SaleImportExcelModel from './sale-import-excel-model';

// ----------------------------------------------------------------------

export default function SaleTableToolbar({
  filters,
  onFilters,
  //
  roleOptions,
  onExport,
  refreshSales,
}) {
  const popover = usePopover();
  const downloadTemplate = useBoolean();
  const importTemplate = useBoolean();

  // Open download template dialog
  const handleOpenDialog = useCallback(() => {
    downloadTemplate.onTrue();
  }, [downloadTemplate]);

  // Open import template dialog
  const handleOpenImportDialog = useCallback(() => {
    importTemplate.onTrue();
  }, [importTemplate]);

  // Handle search text change
  const handleFilterSearch = useCallback(
    (event) => {
      onFilters('searchText', event.target.value);
    },
    [onFilters]
  );

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{
          p: 2.5,
          pr: { xs: 2.5, md: 1 },
        }}
      >
        <Grid item xs={12} md={2}>
          <DatePicker
            label="Start Date"
            value={filters.startDate}
            onChange={(newValue) => onFilters('startDate', newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <DatePicker
            label="End Date"
            value={filters.endDate}
            onChange={(newValue) => onFilters('endDate', newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              value={filters.searchText}
              onChange={handleFilterSearch}
              placeholder="Search..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <IconButton onClick={popover.onOpen} sx={{ ml: 1 }}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 240 }}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog();
          }}
        >
          <Iconify icon="solar:import-bold" />
          Download Template
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleOpenImportDialog();
          }}
        >
          <Iconify icon="solar:import-bold" />
          Import
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onExport();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export
        </MenuItem>
      </CustomPopover>

      <SaleDownloadDummyExcelModel
        open={downloadTemplate.value}
        onClose={() => {
          downloadTemplate.onFalse();
        }}
      />

      <SaleImportExcelModel
        open={importTemplate.value}
        onClose={() => {
          importTemplate.onFalse();
        }}
        refreshSales={refreshSales}
      />
    </>
  );
}

SaleTableToolbar.propTypes = {
  filters: PropTypes.shape({
    startDate: PropTypes.any,
    endDate: PropTypes.any,
    searchText: PropTypes.string,
  }),
  onFilters: PropTypes.func.isRequired,
  roleOptions: PropTypes.array,
  onExport: PropTypes.func.isRequired,
  refreshSales: PropTypes.func.isRequired,
};
