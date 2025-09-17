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
//
// eslint-disable-next-line import/no-extraneous-dependencies
import * as XLSX from 'xlsx';
import { useGetSalesWithFilter } from 'src/api/sale';
import { _roles } from 'src/utils/constants';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'notistack';
import { fDate } from 'src/utils/format-time';
import SaleTableRow from '../sale-table-row';
import SaleTableToolbar from '../sale-table-toolbar';
import SaleTableFiltersResult from '../sale-table-filters-result';
import SaleQuickEditForm from '../sale-quick-edit-form';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }];

const TABLE_HEAD = [
  { id: 'memberName', label: 'Member Name' },
  { id: 'gender', label: 'Gender' },
  { id: 'trainingAt', label: 'Training At' },
  { id: 'memberType', label: 'Member Type' },
  { id: 'salesPerson', label: 'Sales Person' },
  { id: 'trainerName', label: 'Trainer' },
  { id: 'branch', label: 'Branch' },
  { id: 'department', label: 'Department' },
  { id: 'kpi', label: 'Kpi' },
  { id: 'contactNumber', label: 'Contact No.' },
  { id: 'purchaseDate', label: 'Purchase Date' },
  { id: 'membershipType', label: 'Membership Type(s)' },
  { id: 'actualPrice', label: 'Actual Price (AED)' },
  { id: 'discountedPrice', label: 'Discounted Price (AED)' },
  { id: 'validityDays', label: 'Validity (Days)' },
  { id: 'expiryDate', label: 'Expiry Date' },
  { id: 'freezingDays', label: 'Freezing Days' },
  { id: 'createdAt', label: 'Created At' },
  { id: '', width: 88 },
];

const defaultFilters = {
  saleId: '',
  memberName: '',
  plan: '',
  searchText: '', // ✅ added for searching
  status: 'all',
  startDate: null,
  endDate: null,
};

// ----------------------------------------------------------------------

export default function SaleListView() {
  const table = useTable();

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const { enqueueSnackbar } = useSnackbar();

  const [quickEditRow, setQuickEditRow] = useState();

  const quickEdit = useBoolean();

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const [page, setPage] = useState(0); // current page

  const [rowsPerPage, setRowsPerPage] = useState(10); // rows per page

  const [order, setOrder] = useState('asc'); // ✅ backend sorting

  const [orderBy, setOrderBy] = useState('id'); // ✅ backend sorting

  // ✅ Backend filter (exclude deleted)
  const rawFilter = { where: { isDeleted: false } };
  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  // ✅ Correctly use hook with refresh
  const {
    filteredSales: sales,
    totalFilteredSales: totalCount,
    filteredSalesLoading: salesLoading,
    refreshFilteredSales, // ✅ added
  } = useGetSalesWithFilter({
    page,
    rowsPerPage,
    order,
    orderBy,
    startDate: filters.startDate,
    endDate: filters.endDate,
    searchTextValue: filters.searchText,
    extraFilter: { isDeleted: false },
  });

  // ✅ Flatten API response
  useEffect(() => {
    console.log('Sales API raw response:', sales);

    if (sales) {
      const rows = Array.isArray(sales) ? sales : sales.data || [];

      const flattened = rows.map((s) => ({
        ...s,
        memberName: s.memberName || '',
        gender: s.gender || '',
        trainingAt: s.trainingAt || '',
        memberType: s.memberType || '',
        salesPerson: s.salesTrainer
          ? `${s.salesTrainer.firstName} ${s.salesTrainer.lastName || ''}`
          : '',
        trainerName: s.trainer
          ? `${s.trainer.firstName} ${s.trainer.lastName || ''}`
          : '',
        branch: s.branch || '',
        department: s.department || '',
        kpi: s.kpi?.name || '',
        contactNumber: s.contactNumber || '',
        purchaseDate: s.membershipDetails?.purchaseDate || '',
        membershipType:
          s.membershipDetails?.membershipType?.map((m) => m.label).join(', ') ||
          '',
        actualPrice: s.membershipDetails?.actualPrice || '',
        discountedPrice: s.membershipDetails?.discountedPrice || '',
        validityDays: s.membershipDetails?.validityDays || '',
        expiryDate: s.membershipDetails?.expiryDate || '',
        freezingDays: s.membershipDetails?.freezingDays || '',
        createdAt: s.createdAt || '',
      }));

      setTableData(flattened);
    }
  }, [sales]);

  // ✅ Only keep frontend filters (plan/date etc.)
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator('asc', 'id'), // frontend comparator dummy
    filters,
  });

  const dataInPage = dataFiltered; // backend already paginated

  const denseHeight = table.dense ? 52 : 72;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = !salesLoading && dataFiltered.length === 0;

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    [table]
  );

  const handleExport = useCallback(() => {
    const fileName = 'Sales Report.xlsx';
    const formatted = dataFiltered.map((item) => ({
      MemberName: item.memberName,
      Gender: item.gender,
      TrainingAt: item.trainingAt,
      MemberType: item.memberType,
      SalesPerson: item.salesPerson,
      Trainer: item.trainerName,
      Branch: item.branch,
      Department: item.department,
      Kpi: item.kpi,
      ContactNumber: item.contactNumber,
      PurchaseDate: fDate(item.purchaseDate),
      MembershipType: item.membershipType,
      ActualPrice: item.actualPrice,
      DiscountedPrice: item.discountedPrice,
      ValidityDays: item.validityDays,
      ExpiryDate: fDate(item.expiryDate),
      FreezingDays: item.freezingDays,
      CreatedAt: fDate(item.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, fileName);
  }, [dataFiltered]);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        const response = await axiosInstance.delete(`/sales/${id}`);
        if (response.status === 204) {
          enqueueSnackbar('Sale Deleted Successfully');
          confirm.onFalse();
          refreshFilteredSales(); // ✅ fixed
        }
      } catch (error) {
        console.error(
          'Error deleting Sale:',
          error.response?.data || error.message
        );
        enqueueSnackbar('Error deleting sale', { variant: 'error' });
      }
    },
    [confirm, enqueueSnackbar, refreshFilteredSales]
  );

  const handleEditRow = useCallback(
    (id) => router.push(paths.dashboard.sale.edit(id)),
    [router]
  );

  const handleViewRow = useCallback(
    (id) => router.push(paths.dashboard.sale.view(id)),
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
    setPage(table.page);
    setRowsPerPage(table.rowsPerPage);
  }, [table.page, table.rowsPerPage]);

  // useEffect(() => {
  //   console.log('Sales API raw response:', sales);
  // }, [sales]);

  // ----------------------------------------------------------------------

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Sale', href: paths.dashboard.sale.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.sale.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Sale
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
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
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

          <SaleTableToolbar
            filters={filters}
            onFilters={handleFilters}
            roleOptions={_roles}
            onExport={handleExport}
            refreshSales={refreshFilteredSales} // ✅ fixed
            onSearch={(value) => {
              if (value.length >= 3 || value.length === 0) {
                // Only update filters if search has 3+ chars, or user cleared it
                handleFilters('searchText', value);
              }
            }} />

          {canReset && (
            <SaleTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Scrollbar>
              <Table
                size={table.dense ? 'small' : 'medium'}
                sx={{ minWidth: 960 }}
              >
                <TableHeadCustom
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={table.selected.length}
                  onSort={(id) => setOrderBy(id)} // ✅ backend sorting
                  onSelectAllRows={() => { }}
                  showCheckbox={false}
                />

                <TableBody>
                  {dataInPage.map((row) => (
                    <SaleTableRow
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

                  {false && (
                    <TableEmptyRows
                      height={denseHeight}
                      emptyRows={emptyRows(
                        table.page,
                        table.rowsPerPage,
                        tableData.length
                      )}
                    />
                  )}

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={totalCount || 0}
            page={table.page}
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
            Are you sure want to delete{' '}
            <strong>{table.selected.length}</strong> items?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={confirm.onFalse}>
            Delete
          </Button>
        }
      />

      {quickEdit.value && quickEditRow && (
        <SaleQuickEditForm
          currentSale={quickEditRow}
          open={quickEdit.value}
          onClose={() => {
            setQuickEditRow(null);
            quickEdit.onFalse();
          }}
          refreshSales={refreshFilteredSales} // ✅ fixed
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// Filtering logic (frontend-only for plan/date)
// ----------------------------------------------------------------------
const applyFilter = ({ inputData, comparator, filters }) => {
  // Sorting
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  let filtered = stabilizedThis.map((el) => el[0]);

  // 🔎 Sale ID filter
  if (filters.saleId) {
    filtered = filtered.filter((sale) =>
      sale.id?.toString().toLowerCase().includes(filters.saleId.toLowerCase())
    );
  }

  // 🔎 Plan filter
  if (filters.plan) {
    filtered = filtered.filter((sale) =>
      sale.membershipDetails?.plan
        ?.toLowerCase()
        .includes(filters.plan.toLowerCase())
    );
  }

  // 📅 Date range filter
  // if (filters.startDate || filters.endDate) {
  //   const start = filters.startDate
  //     ? new Date(filters.startDate).setHours(0, 0, 0, 0)
  //     : null;
  //   const end = filters.endDate
  //     ? new Date(filters.endDate).setHours(23, 59, 59, 999)
  //     : null;

  //   filtered = filtered.filter((sale) => {
  //     if (!sale.purchaseDate) return false;
  //     const saleDate = new Date(sale.purchaseDate).getTime();
  //     if (Number.isNaN(saleDate)) return false;
  //     if (start && saleDate < start) return false;
  //     if (end && saleDate > end) return false;
  //     return true;
  //   });
  // }

  return filtered;
};
