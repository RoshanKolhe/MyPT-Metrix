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
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useGetKpisWithFilter } from 'src/api/kpi';
import { useAuthContext } from 'src/auth/hooks';
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
  const [selectedKpis, setSelectedKpis] = useState([]);

  const [kpiOptions, setKpiOptions] = useState([]);
  const [salesKpiOptions, setSalesKpiOptions] = useState([]);
  const [serviceKpiOptions, setServiceKpiOptions] = useState([]);

  const kpiQueryString = selectedKpis.length ? `kpiIds=${selectedKpis.join(',')}` : '';

  const { dashboardCounts } = useGetDashboradSummary(kpiQueryString);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredKpis: kpis } = useGetKpisWithFilter(encodedFilter);

  const theme = useTheme();

  const settings = useSettingsContext();

  const handleKpiChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedKpis(typeof value === 'string' ? value.split(',') : value);
  };

  useEffect(() => {
    if (kpis && kpis.length) {
      const sales = kpis.filter((kpi) => kpi.type === 'sales');
      const service = kpis.filter((kpi) => kpi.type === 'service');

      setSalesKpiOptions(sales);
      setServiceKpiOptions(service);
      setKpiOptions(kpis);
    }
  }, [kpis]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {isSuperOrAdmin ? (
        <>
          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ flexShrink: 0, width: { xs: 1, md: 300 } }}>
              <InputLabel>KPIs</InputLabel>
              <Select
                multiple
                size="small"
                value={selectedKpis}
                onChange={handleKpiChange}
                input={<OutlinedInput label="KPIs" />}
                renderValue={(selected) =>
                  selected
                    .map((id) => kpis.find((option) => option.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')
                }
                MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
              >
                {salesKpiOptions &&
                  salesKpiOptions.length &&
                  salesKpiOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      <Checkbox size="small" checked={selectedKpis.includes(option.id)} />
                      {option.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
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
              <EcommerceSaleByGender
                title="Sale By Gender"
                total={2324}
                chart={{
                  series: [
                    { label: 'Mens', value: 44 },
                    { label: 'Womens', value: 75 },
                  ],
                }}
              />
            </Grid>

            <Grid xs={12} md={6} lg={8}>
              <EcommerceSalesOverview title="Sales Overview" data={_ecommerceSalesOverview} />
            </Grid>

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
