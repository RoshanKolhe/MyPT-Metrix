/* eslint-disable no-unsafe-optional-chaining */
import PropTypes from 'prop-types';
import { Box, CardHeader, Card } from '@mui/material';

import Chart, { useChart } from 'src/components/chart';

export default function EcommerceYearlyConductions({
  title,
  subheader,
  dashboradConductionsData,
  ...other
}) {
  const { series = [], categories = [], colors, options = {} } = dashboradConductionsData;

  const chartOptions = useChart({
    colors,
    plotOptions: {
      bar: {
        columnWidth: '60%',
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
      <CardHeader title={title} subheader={subheader} />
      <Box sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(series[0]?.data.length * 80, 600) }}>
          <Chart dir="ltr" type="bar" series={series} options={chartOptions} height={364} />
        </Box>
      </Box>
    </Card>
  );
}

EcommerceYearlyConductions.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  dashboradConductionsData: PropTypes.object,
};
