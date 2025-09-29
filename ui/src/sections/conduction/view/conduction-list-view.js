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
// import { fDate } from 'src/utils/formatTime';

//
import { useGetConductions, exportConductionsWithFilter } from 'src/api/conduction';
import { _roles } from 'src/utils/constants';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'notistack';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as XLSX from 'xlsx';
import ConductionTableRow from '../conduction-table-row';
import ConductionTableToolbar from '../conduction-table-toolbar';
import ConductionTableFiltersResult from '../conduction-table-filters-result';
import ConductionQuickEditForm from '../conduction-quick-edit-form';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }];

const TABLE_HEAD = [
  { id: 'conductionDate', label: 'Conduction Date', width: 150 },
  { id: 'trainer', label: 'Trainer', width: 180 },
  { id: 'branch', label: 'Branch', width: 140 },
  { id: 'department', label: 'Department', width: 140 },
  { id: 'kpi', label: 'KPI', width: 180 },
  { id: 'conductions', label: 'Value', width: 120 },
  { id: 'createdAt', label: 'Created At', width: 160 },
  { id: '', width: 88 },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
  startDate: null,
  endDate: null,
};

// ----------------------------------------------------------------------

export default function ConductionListView() {
  const table = useTable();

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const { enqueueSnackbar } = useSnackbar();

  const [quickEditRow, setQuickEditRow] = useState();

  const quickEdit = useBoolean();

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const { conductions, totalCount, conductionsLoading, conductionsEmpty, refreshConductions } =
    useGetConductions({
      page: table.page,
      rowsPerPage: table.rowsPerPage,
      order: table.order,
      orderBy: table.orderBy,
      startDate: filters.startDate,
      endDate: filters.endDate,
      searchTextValue: filters.name,
    });

  // Format date utility
  const fDate = (date) => (date ? new Date(date).toLocaleDateString('en-GB') : '');


  // const dataFiltered = applyFilter({
  //   inputData: tableData,
  //   comparator: getComparator(table.order, table.orderBy),
  //   filters,
  // });

  // const dataInPage = dataFiltered.slice(
  //   table.page * table.rowsPerPage,
  //   table.page * table.rowsPerPage + table.rowsPerPage
  // );

  const denseHeight = table.dense ? 52 : 72;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = !conductions.length;

  const handleFilters = useCallback(
    (name, value) => {
      console.log('Applying filter:', name, value);
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleExportConductions = useCallback(async () => {
    try {
      // Reuse the same filters from the table
      const exportParams = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        searchTextValue: filters.name, // conduction search field
        extraFilter: { isDeleted: false }, // if you have soft delete logic
      };

      // Call your backend export API for conductions
      const rows = await exportConductionsWithFilter(exportParams); // ✅ your API function

      if (!Array.isArray(rows)) {
        console.error('Export failed: rows is not an array', rows);
        return;
      }

      // Format rows for XLSX
      const formatted = rows.map((item) => ({
        ConductionID: item.id,
        ConductionDate: item.conductionDate,
        Trainer: item.trainer
          ? `${item.trainer.firstName} ${item.trainer.lastName || ''}`
          : '',
        Branch: item.branch?.name || '',
        Department: item.department?.name || '',
        KPI: item.kpi?.name || '',
        Value: item.conductions,
        CreatedAt: fDate(item.createdAt),
      }));

      // Export XLSX
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Conductions');
      XLSX.writeFile(wb, 'Conduction Report.xlsx');
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [filters]);


  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        // Make API call to delete the customer
        const response = await axiosInstance.delete(`/conductions/${id}`);
        if (response.status === 204) {
          enqueueSnackbar('Conduction Deleted Successfully');
          confirm.onFalse();
          refreshConductions();
        }
      } catch (error) {
        console.error('Error deleting Conduction:', error.response?.data || error.message);
        enqueueSnackbar(typeof error === 'string' ? error : error.error.message, {
          variant: 'error',
        });
      }
    },
    [confirm, enqueueSnackbar, refreshConductions]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRows: tableData.length,
      totalRowsInPage: conductions.length,
      totalRowsFiltered: conductions.length,
    });
  }, [conductions.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.conduction.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.conduction.view(id));
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

  useEffect(() => {
    if (conductions) {
      setTableData(conductions);
    }
  }, [conductions]);

  useEffect(() => {
    console.log('Filters updated:', filters);  // ✅ log entire filters object
  }, [filters]);

  useEffect(() => {
    console.log('Conductions updated:', conductions);  // ✅ log API response
  }, [conductions]);



  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Conduction', href: paths.dashboard.conduction.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.conduction.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Conduction
            </Button>
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
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
                      ((tab.value === 'all' || tab.value === filters.status) &&
                        'filled') ||
                      'soft'
                    }
                  >
                    {tab.value === 'all' && (totalCount || 0)}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <ConductionTableToolbar
            filters={filters}
            onFilters={handleFilters}
            //
            roleOptions={_roles}
            onExport={handleExportConductions}

            refreshConductions={refreshConductions}
          />

          {canReset && (
            <ConductionTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={conductions.length}
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
                  {conductions.map((row) => (
                    <ConductionTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onEditRow={() => handleEditRow(row.id)}
                      onViewRow={() => handleViewRow(row.id)}
                      handleQuickEditRow={(conduction) => {
                        handleQuickEditRow(conduction);
                      }}
                      quickEdit={quickEdit}
                    />
                  ))}
                  {false && (
                    <TableEmptyRows
                      height={denseHeight}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
                    />
                  )}

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={totalCount}
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

      {quickEdit.value && quickEditRow && (
        <ConductionQuickEditForm
          currentConduction={quickEditRow}
          open={quickEdit.value}
          onClose={() => {
            setQuickEditRow(null);
            quickEdit.onFalse();
          }}
          refreshConductions={refreshConductions}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

// function applyFilter({ inputData, comparator, filters }) {
//   const { name, status, role } = filters;
//   const stabilizedThis = inputData.map((el, index) => [el, index]);
//   const roleMapping = {
//     super_admin: 'Super Admin',
//     admin: 'Admin',
//     cgm: 'CGM',
//     hod: 'Hod',
//     sub_hod: 'Sub Hod',
//   };
//   stabilizedThis.sort((a, b) => {
//     const order = comparator(a[0], b[0]);
//     if (order !== 0) return order;
//     return a[1] - b[1];
//   });

//   inputData = stabilizedThis.map((el) => el[0]);

//   if (name) {
//     const keyword = name.toLowerCase();

//     inputData = inputData.filter((conduction) =>
//       Object.values(conduction).some((value) => {
//         if (value === null || value === undefined) return false;

//         if (typeof value === 'object') {
//           return Object.values(value).some((nested) =>
//             String(nested).toLowerCase().includes(keyword)
//           );
//         }

//         return String(value).toLowerCase().includes(keyword);
//       })
//     );
//   }

//   if (status !== 'all') {
//     inputData = inputData.filter((conduction) =>
//       status === '1' ? conduction.isActive : !conduction.isActive
//     );
//   }

//   if (role.length) {
//     inputData = inputData.filter(
//       (conduction) =>
//         conduction.permissions &&
//         conduction.permissions.some((conductionRole) => {
//           console.log(conductionRole);
//           const mappedRole = roleMapping[conductionRole];
//           console.log('Mapped Role:', mappedRole); // Check the mapped role
//           return mappedRole && role.includes(mappedRole);
//         })
//     );
//   }

//   if (filters.startDate && filters.endDate) {
//     inputData = inputData.filter((conduction) => {
//       const conductionDate = new Date(conduction.conductionDate);
//       return (
//         conductionDate >= new Date(filters.startDate) && conductionDate <= new Date(filters.endDate)
//       );
//     });
//   }

//   return inputData;
// }
