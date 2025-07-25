import PropTypes from 'prop-types';
// @mui
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { fDate } from 'src/utils/format-time';
import { useAuthContext } from 'src/auth/hooks';
//

// ----------------------------------------------------------------------

export default function SaleTableRow({
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
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');
  const {
    memberName,
    gender,
    trainingAt,
    memberType,
    contactNumber,
    createdAt,
    branch,
    salesTrainer,
    trainer,
    department,
    kpi,
    membershipDetails,
  } = row;

  const confirm = useBoolean();
  const popover = usePopover();

  const membershipLabels = membershipDetails?.membershipType?.map((m) => m.label).join(', ') || '';
  const purchaseDate = fDate(membershipDetails?.purchaseDate);
  const expiryDate = fDate(membershipDetails?.expiryDate);

  return (
    <>
      <TableRow hover selected={selected}>
        {/* Member Info */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{memberName}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{gender}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{trainingAt}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{memberType}</TableCell>

        {/* Sales Trainer */}
        <TableCell>
          <ListItemText
            primary={`${salesTrainer?.firstName} ${salesTrainer?.lastName || ''}`}
            secondary={salesTrainer?.email}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{ component: 'span', color: 'text.disabled' }}
          />
        </TableCell>

        {/* Trainer */}
        <TableCell>
          {trainer ? (
            <ListItemText
              primary={`${trainer?.firstName} ${trainer?.lastName || ''}`}
              secondary={trainer?.email}
              primaryTypographyProps={{ typography: 'body2' }}
              secondaryTypographyProps={{ component: 'span', color: 'text.disabled' }}
            />
          ) : (
            'NA'
          )}
        </TableCell>

        {/* Other Info */}
        <TableCell>{branch?.name}</TableCell>
        <TableCell>{department?.name}</TableCell>
        <TableCell>{kpi?.name || 'NA'}</TableCell>
        <TableCell>{contactNumber}</TableCell>
        <TableCell>{purchaseDate}</TableCell>
        <TableCell>{membershipLabels}</TableCell>
        <TableCell>{membershipDetails?.actualPrice}</TableCell>
        <TableCell>{membershipDetails?.validityDays}</TableCell>
        <TableCell>{expiryDate}</TableCell>
        <TableCell>{membershipDetails?.freezingDays}</TableCell>
        <TableCell>{fDate(createdAt)}</TableCell>

        {/* Actions */}
        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Quick Edit" placement="top" arrow>
            <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={() => onEditRow()}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="View Sale" placement="top" arrow>
            <IconButton onClick={onViewRow}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
          {isSuperOrAdmin ? (
            <Tooltip title="Delete" placement="top" arrow>
              <IconButton
                onClick={() => {
                  confirm.onTrue();
                  popover.onClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          ) : null}
        </TableCell>
      </TableRow>

      {/* Popover Menu */}
      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>
        {/* Optional Delete */}

        <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}

SaleTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onViewRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  quickEdit: PropTypes.any,
  handleQuickEditRow: PropTypes.func,
};
