import { Container, Grid, Typography } from '@mui/material';
import { useSettingsContext } from 'src/components/settings';
import { useGetPtSalesRank } from 'src/api/user';
import PropTypes from 'prop-types';
import PTSales from '../pt-sales';
import PTConductions from '../pt-conductions';
import OverallPerformance from '../overall-performance';

export default function TrainerPerformanceView({dashboardPtSalesRank, dashboardPtConductionsRank, dashboardPtRanks}) {

  const settings = useSettingsContext();
  const tableLabels = [
    { id: 'rank', label: 'Rank' },
    { id: 'staff', label: 'Staff' },
    { id: 'target', label: 'Target' },
    { id: 'actual', label: 'Actual' },
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
            dashboardPtConductionsRank={dashboardPtConductionsRank}
          />
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <OverallPerformance title="Overall Performance" dashboardPtRanks={dashboardPtRanks}/>
        </Grid>
      </Grid>
    </Container>
  );
}

TrainerPerformanceView.propTypes = {
  dashboardPtSalesRank: PropTypes.array,
  dashboardPtConductionsRank: PropTypes.array,
  dashboardPtRanks: PropTypes.array,
};
