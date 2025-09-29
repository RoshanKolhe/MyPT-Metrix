import PropTypes from 'prop-types';
// @mui
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';

// ----------------------------------------------------------------------

function TablePaginationActions({ count, page, rowsPerPage, onPageChange }) {
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5, display: 'flex', gap: 1 }}>
      {/* First Page */}
      <Button
        size="small"
        // variant="outlined"
        onClick={(e) => onPageChange(e, 0)}
        disabled={page === 0}
      >
        {'<<'}
      </Button>

      {/* Previous Page */}
      <Button
        size="small"
        // variant="outlined"
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
      >
        {'<'}
      </Button>

      {/* Next Page */}
      <Button
        size="small"
        // variant="outlined"
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= lastPage}
      >
        {'>'}
      </Button>

      {/* Last Page */}
      <Button
        size="small"
        // variant="contained"
        onClick={(e) => onPageChange(e, lastPage)}
        disabled={page >= lastPage}
      >
        {'>>'}
      </Button>
    </Box>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

export default function TablePaginationCustom({
  dense,
  onChangeDense,
  rowsPerPageOptions = [5, 10, 25],
  sx,
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  ...other
}) {
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  const safePage = Math.min(page, lastPage);

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={count}
        page={safePage}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        SelectProps={{
          disabled: loading,
        }}
        ActionsComponent={(subProps) => (
          <TablePaginationActions {...subProps} count={count} />
        )}
        {...other}
        sx={{
          borderTopColor: 'transparent',
        }}
      />

      {onChangeDense && (
        <FormControlLabel
          label="Dense"
          control={<Switch checked={dense} onChange={onChangeDense} />}
          sx={{
            pl: 2,
            py: 1.5,
            top: 0,
            position: {
              sm: 'absolute',
            },
          }}
        />
      )}
    </Box>
  );
}

TablePaginationCustom.propTypes = {
  dense: PropTypes.bool,
  onChangeDense: PropTypes.func,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  sx: PropTypes.object,
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
