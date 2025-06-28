import { Helmet } from 'react-helmet-async';
// sections
import KpiView from 'src/sections/kpi/view/kpi-view';

// ----------------------------------------------------------------------

export default function KpiViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Kpi View</title>
      </Helmet>

      <KpiView />
    </>
  );
}
