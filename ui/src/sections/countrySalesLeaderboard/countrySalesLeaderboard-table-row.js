/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
// @mui
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function CountrySalesLeaderboardTableRow({
  row,
  selected,
  onEditRow,
  onViewRow,
  onSelectRow,
  onDeleteRow,
  quickEdit,
  handleQuickEditRow,
}) {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.permissions?.includes('super_admin');

  const { country, totalSales, rank } = row;

  const confirm = useBoolean();

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{rank}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{country}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{totalSales}</TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}

CountrySalesLeaderboardTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onViewRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  quickEdit: PropTypes.any,
  handleQuickEditRow: PropTypes.func,
};
