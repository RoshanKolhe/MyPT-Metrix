/* eslint-disable no-unsafe-optional-chaining */
import PropTypes from 'prop-types';
import { Box, CardHeader, Card } from '@mui/material';
import Chart, { useChart } from 'src/components/chart';

export default function EcommerceYearlySales({ title, subheader, dashboradChartData, ...other }) {
  // Fetch chart data from API
  const { series = [], categories = [], colors, options = {} } = dashboradChartData;

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
    grid: {
      padding: {
        right: 50,
      },
    },
    ...options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Box sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(series[0]?.data.length * 80, 600) }}>
          <Chart dir="ltr" type="area" series={series} options={chartOptions} height={450} />
        </Box>
      </Box>
    </Card>
  );
}

EcommerceYearlySales.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  dashboradChartData: PropTypes.object,
};
