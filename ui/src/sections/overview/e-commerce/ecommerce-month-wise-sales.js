/* eslint-disable no-unsafe-optional-chaining */
import PropTypes from 'prop-types';
import { Box, CardHeader, Card, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Chart, { useChart } from 'src/components/chart';
import { useState } from 'react';

export default function EcommerceMonthlySales({
  title,
  subheader,
  dashboradChartData,
  filters,
  setFilters,
  refreshDashboradMonthlyData,
  ...other
}) {
  const [day, setDay] = useState(filters.day || 1);

  const handleDayChange = (event) => {
    const value = event.target.value;
    setDay(value);
    setFilters({ ...filters, day: value });
    refreshDashboradMonthlyData();
  };
  // Fetch chart data from API
  const { series = [], labels: categories = [], colors, options = {} } = dashboradChartData;

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

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="day-label">Day</InputLabel>
            <Select
              labelId="day-label"
              value={day}
              label="Day"
              onChange={handleDayChange}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200, 
                    width: 80, 
                  },
                },
              }}
            >
              {Array.from({ length: 31 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />
      <Box sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(series[0]?.data.length * 80, 600) }}>
          <Chart dir="ltr" type="area" series={series} options={chartOptions} height={450} />
        </Box>
      </Box>
    </Card>
  );
}

EcommerceMonthlySales.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  dashboradChartData: PropTypes.object,
  setFilters: PropTypes.func,
  refreshDashboradMonthlyData: PropTypes.func,
  filters: PropTypes.object,
};
