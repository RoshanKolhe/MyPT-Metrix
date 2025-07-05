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
//

// ----------------------------------------------------------------------

export default function ConductionTableRow({
  row,
  selected,
  onEditRow,
  onViewRow,
  onSelectRow,
  onDeleteRow,
  quickEdit,
  handleQuickEditRow,
}) {
  const {
    memberName,
    gender,
    trainingAt,
    memberType,
    contractNumber,
    sourceOfLead,
    paymentMode,
    paymentReceiptNumber,
    createdAt,
    branch,
    conductionsTrainer,
    trainer,
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

        {/* Conductions Trainer */}
        <TableCell>
          <ListItemText
            primary={`${conductionsTrainer?.firstName} ${conductionsTrainer?.lastName || ''}`}
            secondary={conductionsTrainer?.email}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{ component: 'span', color: 'text.disabled' }}
          />
        </TableCell>

        {/* Trainer */}
        <TableCell>
          <ListItemText
            primary={`${trainer?.firstName} ${trainer?.lastName || ''}`}
            secondary={trainer?.email}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{ component: 'span', color: 'text.disabled' }}
          />
        </TableCell>

        {/* Other Info */}
        <TableCell>{branch?.name}</TableCell>
        <TableCell>{contractNumber}</TableCell>
        <TableCell>{purchaseDate}</TableCell>
        <TableCell>{membershipLabels}</TableCell>
        <TableCell>{membershipDetails?.price}</TableCell>
        <TableCell>{paymentMode}</TableCell>
        <TableCell>{paymentReceiptNumber}</TableCell>
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

          <Tooltip title="View Conduction" placement="top" arrow>
            <IconButton onClick={onViewRow}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
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
        {/* 
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
        */}
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

ConductionTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onViewRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  quickEdit: PropTypes.any,
  handleQuickEditRow: PropTypes.func,
};
