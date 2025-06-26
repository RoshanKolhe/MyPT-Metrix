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
import { format } from 'date-fns';
import { Collapse, Grid, Paper } from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';
//

// ----------------------------------------------------------------------

export default function TargetTableRow({
  row,
  selected,
  onEditRow,
  onViewRow,
  onSelectRow,
  onDeleteRow,
  onAssignTrainerTarget,
}) {
  const { user } = useAuthContext();
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');
  const { startDate, endDate, status, departmentTargets, branch } = row;

  const confirm = useBoolean();

  const popover = usePopover();

  const collapse = useBoolean();

  const renderPrimary = (
    <TableRow hover selected={selected}>
      {/* <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell> */}

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{branch?.name}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {format(new Date(startDate), 'dd MMM yyyy')}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {format(new Date(endDate), 'dd MMM yyyy')}
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (status === 1 && 'success') ||
            (status === 2 && 'error') ||
            (status === 0 && 'warning') ||
            'default'
          }
        >
          {(status === 1 && 'Approved') ||
            (status === 2 && 'Change Requested') ||
            (status === 0 && 'Pending')}
        </Label>
      </TableCell>

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        <>
          <IconButton
            color={collapse.value ? 'inherit' : 'default'}
            onClick={collapse.onToggle}
            sx={{
              ...(collapse.value && {
                bgcolor: 'action.hover',
              }),
            }}
          >
            <Iconify
              icon={collapse.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            />
          </IconButton>
          {isSuperOrAdmin ? (
            <Tooltip title="Edit" placement="top" arrow>
              <IconButton
                onClick={() => {
                  onEditRow();
                }}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
          ) : null}

          <Tooltip title="View Target" placement="top" arrow>
            <IconButton
              onClick={() => {
                onViewRow();
              }}
            >
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        </>
      </TableCell>
    </TableRow>
  );

  const renderSecondary = (
    <TableRow>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
        <Collapse
          in={collapse.value}
          timeout="auto"
          unmountOnExit
          sx={{ bgcolor: 'background.neutral' }}
        >
          <Paper sx={{ m: 1.5, p: 1.5 }}>
            {/* Table Head */}
            <Grid
              container
              sx={{
                bgcolor: 'action.hover',
                fontWeight: 'bold',
                borderBottom: (theme) => `solid 2px ${theme.palette.background.neutral}`,
                p: 1,
              }}
            >
              <Grid item xs={3}>
                Department Name
              </Grid>
              <Grid item xs={3}>
                Target
              </Grid>
              <Grid item xs={3}>
                Action
              </Grid>
            </Grid>

            {/* Table Rows */}
            {departmentTargets?.map((item) => (
              <Grid
                container
                key={item.id}
                sx={{
                  p: 1.5,
                  borderBottom: (theme) => `solid 1px ${theme.palette.background.neutral}`,
                }}
              >
                <Grid item xs={3}>
                  {item?.department?.name}
                </Grid>
                <Grid item xs={3}>
                  {item?.targetValue}
                </Grid>
                <Grid item xs={3}>
                  {status === 1 ? (
                    <Tooltip title="Assign Target">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => onAssignTrainerTarget(item.id)}
                      >
                        <Iconify icon="ic:baseline-assignment" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Grid>
              </Grid>
            ))}
          </Paper>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderPrimary}

      {renderSecondary}

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

TargetTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onViewRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  onAssignTrainerTarget: PropTypes.func,
};
