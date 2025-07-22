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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import Chart, { useChart } from 'src/components/chart';
import { useGetDashboradConductionsData } from 'src/api/user';

export default function EcommerceYearlyConductions({
  title,
  subheader,
  kpiOptions,
  onFilterChange,
  ...other
}) {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedKpis, setSelectedKpis] = useState([]);

  // Build query string
  const queryParams = new URLSearchParams();
  if (selectedKpis.length) queryParams.append('kpiIds', selectedKpis.join(','));
  if (startDate) queryParams.append('startDate', format(startDate, 'yyyy-MM-dd'));
  if (endDate) queryParams.append('endDate', format(endDate, 'yyyy-MM-dd'));
  const kpiQueryString = queryParams.toString();

  // Fetch chart data from API
  const { dashboradConductionsData = {} } = useGetDashboradConductionsData(kpiQueryString);
  const { series = [], categories = [], colors, options = {} } = dashboradConductionsData;
  const chartOptions = useChart({
    colors,
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      markers: {
        width: 12,
        height: 12,
      },
    },
    xaxis: {
      categories,
      labels: {
        rotate: -45,
        trim: true,
        hideOverlappingLabels: true,
      },
      tickPlacement: 'on',
    },
    ...options,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKpiChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedKpis(typeof value === 'string' ? value.split(',') : value);
  };

  const FilterFields = (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl size="small" sx={{ width: { xs: '100%', md: 200 } }}>
          <InputLabel>KPIs</InputLabel>
          <Select
            multiple
            size="small"
            value={selectedKpis}
            onChange={handleKpiChange}
            input={<OutlinedInput label="KPIs" />}
            renderValue={(selected) =>
              selected
                .map((id) => kpiOptions.find((option) => option.id === id)?.name)
                .filter(Boolean)
                .join(', ')
            }
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {(kpiOptions ?? []).map((option) => (
              <MenuItem key={option.id} value={option.id}>
                <Checkbox size="small" checked={selectedKpis.includes(option.id)} />
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  // Notify parent of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        startDate,
        endDate,
        kpis: selectedKpis,
      });
    }
  }, [startDate, endDate, selectedKpis, onFilterChange]);

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={!isMobile && <Box sx={{ minWidth: 300 }}>{FilterFields}</Box>}
      />
      {isMobile && <Box sx={{ mt: 2, px: 3, pb: 2 }}>{FilterFields}</Box>}
      <Box sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(series[0]?.data.length * 80, 600) }}>
          <Chart dir="ltr" type="area" series={series} options={chartOptions} height={364} />
        </Box>
      </Box>
    </Card>
  );
}

EcommerceYearlyConductions.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  kpiOptions: PropTypes.array,
  onFilterChange: PropTypes.func,
};
