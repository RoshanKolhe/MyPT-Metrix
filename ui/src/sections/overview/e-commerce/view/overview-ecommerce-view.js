// @mui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
// hooks
import { useMockedUser } from 'src/hooks/use-mocked-user';
// _mock
import {
  _ecommerceSalesOverview,
  _ecommerceBestSalesman,
  _ecommerceLatestProducts,
} from 'src/_mock';
// components
import { useSettingsContext } from 'src/components/settings';
//
import { useGetDashboradSummary } from 'src/api/user';
import { fShortenNumber } from 'src/utils/format-number';
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useGetKpisWithFilter } from 'src/api/kpi';
import { useAuthContext } from 'src/auth/hooks';
import { useGetBranchsWithFilter } from 'src/api/branch';
import EcommerceYearlySales from '../ecommerce-yearly-sales';
import EcommerceBestSalesman from '../ecommerce-best-salesman';
import EcommerceSaleByGender from '../ecommerce-sale-by-gender';
import EcommerceSalesOverview from '../ecommerce-sales-overview';
import EcommerceWidgetSummary from '../ecommerce-widget-summary';
import EcommerceLatestProducts from '../ecommerce-latest-products';
import EcommerceYearlyConductions from '../ecommerce-yearly-conductions';
import EcommerceTargetForecasting from '../ecommerce-target-forecasting';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useAuthContext();
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');

  const [selectedKpiIds, setSelectedKpiIds] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState();

  const [departments, setDepartments] = useState([]);
  const [kpiOptions, setKpiOptions] = useState([]);
  const [salesKpiOptions, setSalesKpiOptions] = useState([]);
  const [serviceKpiOptions, setServiceKpiOptions] = useState([]);

  const kpiQueryString = selectedKpiIds.length ? `kpiIds=${selectedKpiIds.join(',')}` : '';

  const { dashboardCounts } = useGetDashboradSummary(kpiQueryString);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches } = useGetBranchsWithFilter(encodedFilter);

  const theme = useTheme();

  const settings = useSettingsContext();

  // useEffect(() => {
  //   if (kpis && kpis.length) {
  //     const sales = kpis.filter((kpi) => kpi.type === 'sales');
  //     const service = kpis.filter((kpi) => kpi.type === 'service');

  //     setSalesKpiOptions(sales);
  //     setServiceKpiOptions(service);
  //     setKpiOptions(kpis);
  //   }
  // }, [kpis]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {isSuperOrAdmin ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              {/* Branch Autocomplete */}
              <Grid item xs={12} md={3}>
                <FormControl size="small" fullWidth>
                  <Autocomplete
                    size="small"
                    options={branches}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={branches.find((b) => b.id === selectedBranchId) || null}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setSelectedBranchId(newValue.id);
                        setDepartments(newValue.departments || []);
                        setSelectedDepartmentId(null); // reset department on branch change
                      } else {
                        setSelectedBranchId(null);
                        setDepartments([]);
                        setSelectedDepartmentId(null);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Branch" placeholder="Select Branch" />
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                {/* Department Autocomplete */}
                <FormControl size="small" fullWidth>
                  <Autocomplete
                    size="small"
                    options={departments}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={departments.find((d) => d.id === selectedDepartmentId) || null}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setSelectedDepartmentId(newValue.id);
                        setKpiOptions(newValue.kpis || []);
                        setSelectedKpiIds([]); // Clear selected KPIs
                      } else {
                        setSelectedDepartmentId(null);
                        setKpiOptions([]);
                        setSelectedKpiIds([]);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Department" placeholder="Select Department" />
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                {/* Department Autocomplete */}
                <FormControl size="small" fullWidth>
                  <Autocomplete
                    multiple
                    size="small"
                    options={kpiOptions}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={kpiOptions.filter((kpi) => selectedKpiIds.includes(kpi.id))}
                    onChange={(event, newValue) => {
                      // newValue is an array of selected KPI objects
                      setSelectedKpiIds(newValue.map((kpi) => kpi.id));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="KPIs" placeholder="Select KPIs" />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          <Grid container spacing={3}>
            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title="Total Revenue"
                percent={dashboardCounts?.revenue?.percent}
                total={fShortenNumber(dashboardCounts?.revenue?.value || 0)}
                chart={{
                  series: dashboardCounts?.revenue?.series || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title="Total Units"
                percent={dashboardCounts?.tickets?.percent}
                total={fShortenNumber(dashboardCounts?.tickets?.value || 0)}
                chart={{
                  colors: [theme.palette.info.light, theme.palette.info.main],
                  series: dashboardCounts?.tickets?.series || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title="Avg Unit Value"
                percent={dashboardCounts?.averageTicket?.percent}
                total={fShortenNumber(dashboardCounts?.averageTicket?.value || 0)}
                chart={{
                  colors: [theme.palette.warning.light, theme.palette.warning.main],
                  series: dashboardCounts?.averageTicket?.series || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceYearlySales
                title="Daily KPI Sales"
                subheader="Tracks daily PT & Membership client additions over time"
                chart={[]}
                kpiOptions={kpiOptions}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceYearlyConductions
                title="Daily Conductions"
                subheader="Tracks daily conductions over time"
                chart={[]}
                kpiOptions={serviceKpiOptions}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceTargetForecasting title="Forecasting" subheader="Target forecasting" />
            </Grid>

            <Grid xs={12} md={6} lg={4}>
              <EcommerceSaleByGender title="Sale By Gender" />
            </Grid>

            {/* <Grid xs={12} md={6} lg={8}>
              <EcommerceSalesOverview title="Sales Overview" data={_ecommerceSalesOverview} />
            </Grid> */}

            <Grid xs={12} md={12} lg={12}>
              <EcommerceBestSalesman
                title="Best Salesman"
                tableData={_ecommerceBestSalesman}
                tableLabels={[
                  { id: 'name', label: 'Seller' },
                  { id: 'category', label: 'Product' },
                  { id: 'country', label: 'Country', align: 'center' },
                  { id: 'totalAmount', label: 'Total', align: 'right' },
                  { id: 'rank', label: 'Rank', align: 'right' },
                ]}
              />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  );
}
