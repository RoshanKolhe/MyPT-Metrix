/* eslint-disable no-unsafe-optional-chaining */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
  MenuItem,
  Box,
  Stack,
  Chip,
  TextField,
  CardHeader,
  Card,
  Checkbox,
  FormControl,
  Grid,
  InputLabel,
  OutlinedInput,
  Select,
  useMediaQuery,
  useTheme,
  Typography,
  alpha,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import Chart, { useChart } from 'src/components/chart';
import { useGetDashboradChartData, useGetDashboradForecastingData } from 'src/api/user';
import Iconify from 'src/components/iconify';

export default function EcommerceTargetForecasting({
  title,
  subheader,
  kpiOptions,
  onFilterChange,
  ...other
}) {
  const [interval, setInterval] = useState('monthly');
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedKpis, setSelectedKpis] = useState([]);

  // Build query string
  const kpiQueryString = `interval=${interval}`;

  // Fetch chart data from API
  const { dashboradChartData = {} } = useGetDashboradForecastingData(kpiQueryString);
  const { targetSeries = [], actualSeries = [], labels = [], forecast = {} } = dashboradChartData;
  const percent = forecast?.variancePercent ?? 0;
  const series = [
    { name: 'Target', data: targetSeries },
    { name: 'Actual', data: actualSeries },
  ];

  const chartOptions = useChart({
    chart: {
      id: 'target-forecast-chart',
      type: 'area',
      toolbar: { show: false },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -45,
        trim: true,
        hideOverlappingLabels: true,
      },
      tickPlacement: 'on',
    },
    tooltip: {
      y: {
        formatter: (val) => `₹${val.toLocaleString()}`,
      },
    },
    stroke: {
      curve: 'smooth',
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      markers: {
        width: 12,
        height: 12,
      },
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKpiChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedKpis(typeof value === 'string' ? value.split(',') : value);
  };

  // const FilterFields = (
  //   <Grid container spacing={2}>
  //     <Grid item xs={12} sm={6} md={4}>
  //       <DatePicker
  //         label="Start Date"
  //         value={startDate}
  //         onChange={(newValue) => setStartDate(newValue)}
  //         slotProps={{ textField: { size: 'small', fullWidth: true } }}
  //       />
  //     </Grid>
  //     <Grid item xs={12} sm={6} md={4}>
  //       <DatePicker
  //         label="End Date"
  //         value={endDate}
  //         onChange={(newValue) => setEndDate(newValue)}
  //         slotProps={{ textField: { size: 'small', fullWidth: true } }}
  //       />
  //     </Grid>
  //     <Grid item xs={12} md={4}>
  //       <FormControl size="small" sx={{ width: { xs: '100%', md: 200 } }}>
  //         <InputLabel>KPIs</InputLabel>
  //         <Select
  //           multiple
  //           size="small"
  //           value={selectedKpis}
  //           onChange={handleKpiChange}
  //           input={<OutlinedInput label="KPIs" />}
  //           renderValue={(selected) =>
  //             selected
  //               .map((id) => kpiOptions.find((option) => option.id === id)?.name)
  //               .filter(Boolean)
  //               .join(', ')
  //           }
  //           MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
  //         >
  //           {(kpiOptions ?? []).map((option) => (
  //             <MenuItem key={option.id} value={option.id}>
  //               <Checkbox size="small" checked={selectedKpis.includes(option.id)} />
  //               {option.name}
  //             </MenuItem>
  //           ))}
  //         </Select>
  //       </FormControl>
  //     </Grid>
  //   </Grid>
  // );

  // Notify parent of filter changes
  // useEffect(() => {
  //   if (onFilterChange) {
  //     onFilterChange({
  //       startDate,
  //       endDate,
  //       kpis: selectedKpis,
  //     });
  //   }
  // }, [startDate, endDate, selectedKpis, onFilterChange]);

  return (
    <>
      <Card
        sx={{
          mt: 2,
          mb: 3,
          borderLeft: '4px solid',
          borderColor: percent < 0 ? 'error.main' : 'success.main',
          backgroundColor: percent < 0 ? '#fff5f5' : '#f0fcf5',
          borderRadius: 0,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'}
              sx={{
                p: 0.5,
                width: 24,
                height: 24,
                borderRadius: '50%',
                color: percent < 0 ? 'error.main' : 'success.main',
                bgcolor: alpha(theme.palette[percent < 0 ? 'error' : 'success'].main, 0.16),
              }}
            />

            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color={percent < 0 ? 'error.main' : 'success.main'}
              >
                {forecast?.status}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {forecast?.message}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>
      <Card {...other}>
        <CardHeader title={title} subheader={subheader} />
        {/* {isMobile && <Box sx={{ mt: 2, px: 3, pb: 2 }}>{FilterFields}</Box>} */}
        <Box sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
          <Box sx={{ minWidth: Math.max(series[0]?.data.length * 80, 600) }}>
            <Chart dir="ltr" type="area" series={series} options={chartOptions} height={364} />
          </Box>
        </Box>
      </Card>
    </>
  );
}

EcommerceTargetForecasting.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  kpiOptions: PropTypes.array,
  onFilterChange: PropTypes.func,
};
