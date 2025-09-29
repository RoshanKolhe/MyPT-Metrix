/* eslint-disable no-nested-ternary */
import isEqual from 'lodash/isEqual';
import { useState, useCallback, useEffect } from 'react';
// @mui
import { alpha } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import * as XLSX from 'xlsx';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  getComparator,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';
//
import { useGetUsersWithFilter } from 'src/api/user';
import { _roles, USER_STATUS_OPTIONS } from 'src/utils/constants';
import { useAuthContext } from 'src/auth/hooks';
import UserTableRow from '../user-table-row';
import UserTableToolbar from '../user-table-toolbar';
import UserTableFiltersResult from '../user-table-filters-result';
import UserQuickEditForm from '../user-quick-edit-form';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

const TABLE_HEAD = [
  { id: 'id', label: '#' },
  { id: 'name', label: 'Name' },
  { id: 'phoneNumber', label: 'Phone Number', width: 180 },
  { id: 'role', label: 'Role', width: 180 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
};

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  cgm: 'CGM',
  hod: 'Hod',
  sub_hod: 'Sub Hod',
};

// ----------------------------------------------------------------------

export default function UserListView() {
  const { user: currentUser } = useAuthContext();
  const userRole = currentUser?.permissions?.[0];

  const roleOptions =
    userRole === 'hod'
      ? _roles.filter((r) => r === roleLabels.sub_hod)
      : userRole === 'cgm'
        ? _roles.filter((r) => r === roleLabels.hod || r === roleLabels.sub_hod)
        : _roles;

  const table = useTable({ defaultOrderBy: 'id' });
  const settings = useSettingsContext();
  const router = useRouter();
  const confirm = useBoolean();

  const [quickEditRow, setQuickEditRow] = useState(null);
  const quickEdit = useBoolean();
  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);

  // ---- API CALL (must come before using in useEffect)
  const {
    filteredUsers,
    total: totalFilteredUsers,
    refreshFilterUsers,
  } = useGetUsersWithFilter({
    page: table.page + 1, // backend expects 1-based
    limit: table.rowsPerPage,
    filter: {
      search: filters.name,
      role: filters.role.map((r) => r.toLowerCase().replace(' ', '_')),
    },
  });

  // ---- SYNC tableData with API response
  useEffect(() => {
    if (Array.isArray(filteredUsers)) {
      setTableData(filteredUsers.filter((obj) => !obj.permissions.includes('super_admin')));
    }
  }, [filteredUsers]);

  const roleFilter = filters.role.map((r) => r.toLowerCase().replace(' ', '_'));

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  }).filter((user) => {
    // Role match: check if any selected role is in user.permissions
    const roleMatch =
      roleFilter.length === 0 || user.permissions.some((p) => roleFilter.includes(p));

    // Name match
    const nameMatch =
      !filters.name ||
      `${user.firstName || ''} ${user.lastName || ''}`
        .toLowerCase()
        .includes(filters.name.toLowerCase());

    return roleMatch && nameMatch;
  });


  const denseHeight = table.dense ? 52 : 72;
  const canReset = !isEqual(defaultFilters, filters);
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // ---- Handlers
  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);
      setTableData(deleteRow);
      table.onUpdatePageDeleteRow(tableData.length);
    },
    [table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);
    table.onUpdatePageDeleteRows({
      totalRows: tableData.length,
      totalRowsInPage: tableData.length,
    });
  }, [table, tableData]);

  const handleEditRow = useCallback(
    (id) => router.push(paths.dashboard.user.edit(id)),
    [router]
  );

  const handleViewRow = useCallback(
    (id) => router.push(paths.dashboard.user.view(id)),
    [router]
  );

  const handleQuickEditRow = useCallback(
    (row) => {
      setQuickEditRow(row);
      quickEdit.onTrue();
    },
    [quickEdit]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => handleFilters('status', newValue),
    [handleFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    refreshFilterUsers();   // force API to fetch all users again
  }, [refreshFilterUsers]);

  const handleExport = useCallback(() => {
    const fileName = 'User Report.xlsx';
    const formatted = dataFiltered.map((item) => ({
      ID: item?.id || '',
      FirstName: item?.firstName || '',
      LastName: item?.lastName || '',
      DateOfBirth: item?.dob || '',
      Country: item?.country || '',
      FullAddress: item?.fullAddress || '',
      City: item?.city || '',
      State: item?.state || '',
      Email: item?.email || '',
      PhoneNumber: item?.phoneNumber || '',
      IsActive: item?.isActive ? 'Yes' : 'No',
      CreatedAt: item?.createdAt || '',
    }));
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User');
    XLSX.writeFile(wb, fileName);
  }, [dataFiltered]);

  // ---- Render
  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'User', href: paths.dashboard.user.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New User
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={filters.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.status) && 'filled') || 'soft'
                    }
                    color={
                      (tab.value === '1' && 'success') ||
                      (tab.value === '0' && 'error') ||
                      'default'
                    }
                  >
                    {tab.value === 'all' && tableData.length}
                    {tab.value === '1' && tableData.filter((u) => u.isActive).length}
                    {tab.value === '0' && tableData.filter((u) => !u.isActive).length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onFilters={handleFilters}
            roleOptions={roleOptions}
            onExport={handleExport}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={totalFilteredUsers || 0}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  tableData.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      tableData.map((row) => row.id)
                    )
                  }
                  showCheckbox={false}
                />

                <TableBody>
                  {dataFiltered.map((row) => (
                    <UserTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onEditRow={() => handleEditRow(row.id)}
                      onViewRow={() => handleViewRow(row.id)}
                      handleQuickEditRow={handleQuickEditRow}
                      quickEdit={quickEdit}
                    />
                  ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={totalFilteredUsers || 0}
            page={Number.isNaN(table.page) ? 0 : table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong>{table.selected.length}</strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />

      {quickEdit.value && quickEditRow && (
        <UserQuickEditForm
          currentUser={quickEditRow}
          open={quickEdit.value}
          onClose={() => {
            setQuickEditRow(null);
            quickEdit.onFalse();
          }}
          refreshUsers={refreshFilterUsers}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { status } = filters;
  const stabilizedThis = inputData.map((el, idx) => [el, idx]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (status !== 'all') {
    inputData = inputData.filter((user) => (status === '1' ? user.isActive : !user.isActive));
  }

  return inputData;
}
