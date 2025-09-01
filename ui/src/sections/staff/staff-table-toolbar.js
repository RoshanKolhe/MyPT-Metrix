import PropTypes from 'prop-types';
import { useCallback } from 'react';
// @mui
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import StaffDownloadDummyExcelModel from './staff-download-dummy-excel-model';
import StaffImportExcelModel from './staff-import-excel-model';

// ----------------------------------------------------------------------

export default function StaffTableToolbar({
  filters,
  onFilters,
  //
  roleOptions,
  onExport,
  refreshStaffs,
}) {
  const popover = usePopover();
  const downloadTemplate = useBoolean();
  const importTemplate = useBoolean();

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleOpenDialog = useCallback(() => {
    downloadTemplate.onTrue();
  }, [downloadTemplate]);

  const handleOpenImportDialog = useCallback(() => {
    importTemplate.onTrue();
  }, [importTemplate]);

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{
          xs: 'column',
          md: 'row',
        }}
        sx={{
          p: 2.5,
          pr: { xs: 2.5, md: 1 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder="Search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>
      </Stack>

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

      <StaffDownloadDummyExcelModel
        open={downloadTemplate.value}
        onClose={() => {
          downloadTemplate.onFalse();
        }}
      />

      <StaffImportExcelModel
        open={importTemplate.value}
        onClose={() => {
          importTemplate.onFalse();
        }}
        refreshStaffs={refreshStaffs}
      />
    </>
  );
}

StaffTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  roleOptions: PropTypes.array,
  refreshStaffs: PropTypes.func,
  onExport: PropTypes.func,
};
