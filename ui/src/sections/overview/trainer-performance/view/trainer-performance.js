import { Container, Grid, Typography } from '@mui/material';
import { useSettingsContext } from 'src/components/settings';
import { useGetPtSalesRank } from 'src/api/user';
import PropTypes from 'prop-types';
import PTSales from '../pt-sales';
import PTConductions from '../pt-conductions';
import OverallPerformance from '../overall-performance';

export default function TrainerPerformanceView({dashboardPtSalesRank}) {
  console.log('dashboardPtSalesRank1',dashboardPtSalesRank);
  const settings = useSettingsContext();
  const tableLabels = [
    { id: 'rank', label: 'Rank' },
    { id: 'staff', label: 'Staff' },
    { id: 'target', label: 'Target' },
    { id: 'actual', label: 'Actual' },
  ];

  const tableDataPtconductions = [
    { id: 1, rank: 1, staff: 'John Doe', target: 50, actual: 45 },
    { id: 2, rank: 2, staff: 'Doe Smith', target: 40, actual: 42 },
    { id: 3, rank: 3, staff: 'Jane Doe', target: 40, actual: 42 },
    { id: 4, rank: 4, staff: 'Doe Smith', target: 40, actual: 42 },
    { id: 5, rank: 5, staff: 'Jane Smith', target: 40, actual: 42 },
    { id: 6, rank: 6, staff: 'Jane Smith', target: 40, actual: 42 },
    { id: 7, rank: 7, staff: 'Jane Smith', target: 40, actual: 42 },
    { id: 8, rank: 8, staff: 'Jane Smith', target: 40, actual: 42 },
    { id: 9, rank: 9, staff: 'Jane Smith', target: 40, actual: 42 },
    { id: 10, rank: 10, staff: 'Jane Smith', target: 40, actual: 42 },
  ];
  const data = [
    { id: 1, name: 'Alex Johnson', value: 123.3, avatar: '/avatars/1.png' },
    { id: 2, name: 'Sarah Miller', value: 120.0, avatar: '/avatars/2.png' },
    { id: 3, name: 'Mike Chen', value: 112.6, avatar: '/avatars/3.png' },
    { id: 4, name: 'Emma Davis', value: 109.3, avatar: '/avatars/4.png' },
    { id: 5, name: 'Tom Wilson', value: 106.1, avatar: '/avatars/5.png' },
    { id: 6, name: 'Lisa Brown', value: 98.2, avatar: '/avatars/6.png' },
    { id: 7, name: 'John Smith', value: 93.3, avatar: '/avatars/7.png' },
    { id: 8, name: 'Kate Lee', value: 95.0, avatar: '/avatars/8.png' },
  ];

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: 0 }} disableGutters>
      <Typography sx={{ mb: 3, fontWeight: 'bold', fontSize: '20px' }}>
        Trainer Performance
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} lg={4}>
          <PTSales tableLabels={tableLabels} dashboardPtSalesRank={dashboardPtSalesRank}/>
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <PTConductions
            tableLabels={tableLabels}
            tableDataPtconductions={tableDataPtconductions}
          />
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <OverallPerformance title="Overall Performance" data={data} />
        </Grid>
      </Grid>
    </Container>
  );
}

TrainerPerformanceView.propTypes = {
  dashboardPtSalesRank: PropTypes.array,
};
