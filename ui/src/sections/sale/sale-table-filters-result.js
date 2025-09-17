import PropTypes from 'prop-types';
// @mui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

// components
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function SaleTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  ...other
}) {
  // Handler to remove Status filter
  const handleRemoveStatus = () => {
    onFilters('status', 'all');
  };

  // Handler to remove a Role from role array filter
  const handleRemoveRole = (inputValue) => {
    // Ensure filters.role is always an array
    const roles = Array.isArray(filters.role) ? filters.role : [];
    const newValue = roles.filter((item) => item !== inputValue);
    onFilters('role', newValue);
  };

  // Handler to remove Start Date filter
  const handleRemoveStartDate = () => {
    onFilters('startDate', null);
  };

  // Handler to remove End Date filter
  const handleRemoveEndDate = () => {
    onFilters('endDate', null);
  };

  return (
    <Stack spacing={1.5} {...other}>
      {/* Display total results */}
      <Box sx={{ typography: 'body2' }}>
        <strong>{results ?? 0}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      {/* Display active filter chips */}
      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {/* Status Filter */}
        {filters.status !== 'all' && (
          <Block label="Status:">
            <Chip
              size="small"
              label={filters.status === '1' ? 'Active' : 'In-Active'}
              onDelete={handleRemoveStatus}
            />
          </Block>
        )}

        {/* Role Filter */}
        {Array.isArray(filters.role) && filters.role.length > 0 && (
          <Block label="Role:">
            {filters.role.map((item) => (
              <Chip
                key={item}
                label={item}
                size="small"
                onDelete={() => handleRemoveRole(item)}
              />
            ))}
          </Block>
        )}

        {/* Start Date Filter */}
        {filters.startDate && (
          <Block label="Start Date:">
            <Chip
              size="small"
              label={new Date(filters.startDate).toLocaleDateString()}
              onDelete={handleRemoveStartDate}
            />
          </Block>
        )}

        {/* End Date Filter */}
        {filters.endDate && (
          <Block label="End Date:">
            <Chip
              size="small"
              label={new Date(filters.endDate).toLocaleDateString()}
              onDelete={handleRemoveEndDate}
            />
          </Block>
        )}

        {/* Clear All Filters Button */}
        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// PropTypes
// ----------------------------------------------------------------------

SaleTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.number,
};

// ----------------------------------------------------------------------
// Helper Block Component
// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      {/* Label */}
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      {/* Child Chips */}
      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// PropTypes for Block
// ----------------------------------------------------------------------

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
};
