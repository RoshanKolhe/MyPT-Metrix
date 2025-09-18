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
import * as XLSX from 'xlsx';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// _mock
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
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
import { useGetSalesmanLeaderboardsWithFilter } from 'src/api/salesmanLeaderboard';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'notistack';
import { _roles, TRAINER_LEADERBOARD_STATUS_OPTIONS } from 'src/utils/constants';
import { useAuthContext } from 'src/auth/hooks';
import PropTypes from 'prop-types';
import SalesmanLeaderboardTableToolbar from '../salesmanLeaderboard-table-toolbar';
import SalesmanLeaderboardTableFiltersResult from '../salesmanLeaderboard-table-filters-result';
import SalesmanLeaderboardTableRow from '../salesmanLeaderboard-table-row';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...TRAINER_LEADERBOARD_STATUS_OPTIONS];

const TABLE_HEAD = [
  { id: 'trainerId', label: 'Trainer Id' },
  { id: 'name', label: 'Staff Name' },
  { id: 'branch', label: 'Branch' },
  { id: 'department', label: 'Department' },
  { id: 'target', label: 'Target' },
  { id: 'actual', label: 'Actual' },
  { id: 'achieved', label: 'Achieved' },
  { id: 'status', label: 'Status', width: 180 },
  { id: 'rank', label: 'Rank', width: 180 },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
  branch: '',
  department: '',
};

// ----------------------------------------------------------------------

export default function SalesmanLeaderboardListView({ filter, branches }) {
  console.log(branches);
  const { user } = useAuthContext();
  const isSuperAdmin = user?.permissions?.includes('super_admin');

  const table = useTable({ defaultOrderBy: 'rank' });

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);

  const [quickEditRow, setQuickEditRow] = useState();

  const quickEdit = useBoolean();

  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState(defaultFilters);

  const {
    filteredSalesmanLeaderboards: salesmanLeaderboards,
    salesmanLeaderboardsLoading,
    salesmanLeaderboardsEmpty,
    refreshFilterSalesmanLeaderboards,
  } = useGetSalesmanLeaderboardsWithFilter(filter);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 52 : 72;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        // Make API call to delete the salesmanLeaderboard
        const response = await axiosInstance.delete(`/salesmanLeaderboard/${id}`);
        if (response.status === 204) {
          console.log('SalesmanLeaderboard deleted successfully');
          enqueueSnackbar('SalesmanLeaderboard Deleted Successfully');
          confirm.onFalse();
          refreshFilterSalesmanLeaderboards();
        }
      } catch (error) {
        console.error('Error deleting salesmanLeaderboard:', error.response?.data || error.message);
        enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
          variant: 'error',
        });
      }
    },
    [confirm, enqueueSnackbar, refreshFilterSalesmanLeaderboards]
  );

  const handleDeleteRows = useCallback(() => {
    console.log('here');
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRows: tableData.length,
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.salesmanLeaderboard.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.salesmanLeaderboard.view(id));
    },
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
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleExport = useCallback(() => {
    const fileName = 'salesmanLeaderboard.xlsx';

    const formatted = dataFiltered.map((item) => ({
      Id: item.id || '',
      Name: item.name || '',
      Description: item.description || '',
      Status: item.isActive ? 'Active' : 'In-Active' || '',
      CreatedAt: item.createdAt || '',
    }));
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SalesmanLeaderboards');
    XLSX.writeFile(wb, fileName);
  }, [dataFiltered]);

  useEffect(() => {
    if (salesmanLeaderboards) {
      // const updatedSalesmanLeaderboards = salesmanLeaderboards.filter((obj) => !obj.permissions.includes('super_admin'));
      setTableData(salesmanLeaderboards);
    }
  }, [salesmanLeaderboards]);

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
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
                      (tab.value === 'Over Achiever' && 'success') ||
                      (tab.value === 'Under Performer' && 'error') ||
                      (tab.value === 'Achiever' && 'warning') ||
                      'default'
                    }
                  >
                    {tab.value === 'all' && tableData.length}
                    {tab.value === 'Over Achiever' &&
                      tableData.filter((s) => s.status === 'Over Achiever').length}
                    {tab.value === 'Under Performer' &&
                      tableData.filter((s) => s.status === 'Under Performer').length}
                    {tab.value === 'Achiever' &&
                      tableData.filter((s) => s.status === 'Achiever').length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <SalesmanLeaderboardTableToolbar
            filters={filters}
            onFilters={handleFilters}
            //
            roleOptions={_roles}
            onExport={handleExport}
            branches={branches || []}
          />

          {canReset && (
            <SalesmanLeaderboardTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={dataFiltered.length}
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
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <SalesmanLeaderboardTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                        onViewRow={() => handleViewRow(row.id)}
                        handleQuickEditRow={(salesmanLeaderboard) => {
                          handleQuickEditRow(salesmanLeaderboard);
                        }}
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
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            //
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
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
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
    </>
  );
}

SalesmanLeaderboardListView.propTypes = {
  filter: PropTypes.any,
  branches: PropTypes.array,
};

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  console.log(filters);
  const { name, status, role, branch, department } = filters;
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  const roleMapping = {
    production_head: 'Production Head',
    initiator: 'Initiator',
    validator: 'Validator',
  };
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((trainer) =>
      Object.values(trainer).some((value) =>
        String(value).toLowerCase().includes(name.toLowerCase())
      )
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((trainer) => trainer.status === status);
  }
  if (branch) {
    inputData = inputData.filter((trainer) => trainer.branchId === branch); // updated to use branchId
  }

  if (department) {
    inputData = inputData.filter((trainer) => trainer.departmentId === department); // updated to use departmentId
  }

  if (role.length) {
    inputData = inputData.filter(
      (trainer) =>
        trainer.permissions &&
        trainer.permissions.some((trainerRole) => {
          console.log(trainerRole);
          const mappedRole = roleMapping[trainerRole];
          console.log('Mapped Role:', mappedRole); // Check the mapped role
          return mappedRole && role.includes(mappedRole);
        })
    );
  }

  return inputData;
}
