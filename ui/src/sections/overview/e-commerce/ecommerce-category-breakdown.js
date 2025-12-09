import PropTypes from 'prop-types';
// @mui
import { useTheme, styled } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
// utils
import { fNumber } from 'src/utils/format-number';
// components
import Chart, { useChart } from 'src/components/chart';
import { Box, Grid, Stack, Typography } from '@mui/material';

// ----------------------------------------------------------------------

const CHART_HEIGHT = 400;

const LEGEND_HEIGHT = 72;

const StyledChart = styled(Chart)(({ theme }) => ({
  height: CHART_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& .apexcharts-canvas, .apexcharts-inner, svg, foreignObject': {
    height: '100% !important',
  },

  // Remove unwanted dashed line and forced legend positioning
  '& .apexcharts-legend': {
    display: 'none !important',
  },
}));

// ----------------------------------------------------------------------

export default function EcommerceCategoryBreakdown({ title, subheader, chart, ...other }) {
  const theme = useTheme();

  const { series, options } = chart;
  console.log('series', series);
  const chartSeries = series.map((i) => i.percentage);

  const chartOptions = useChart({
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    labels: series.map((i) => i.label),
    stroke: { colors: [theme.palette.background.paper] },
    legend: {
      show: false,
    },

    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (value) => fNumber(value),
        title: {
          formatter: (seriesName) => `${seriesName}`,
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '85%',
          width: 100,
          labels: {
            show: true,
            value: { formatter: (value) => fNumber(value) },
            total: {
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return fNumber(sum);
              },
            },
          },
        },
      },
    },

    ...options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Grid container spacing={2} sx={{ px: 2 }}>
        {/* LEFT — Chart */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StyledChart dir="ltr" type="donut" series={chartSeries} options={chartOptions} />
          </Box>
        </Grid>

        {/* RIGHT — Legend */}
        <Grid item xs={12} md={6} sx={{ pr: 2 }}>
          {series.map((item, idx) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: '5px',
              }}
            >
              {/* Left: dot + label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                  }}
                />
                <Stack>
                  <Typography variant="subtitle2">{item.label}</Typography>
                </Stack>
              </Box>

              {/* Right: stats */}
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">{item.percentage}%</Typography>
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Card>
  );
}

EcommerceCategoryBreakdown.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
};
