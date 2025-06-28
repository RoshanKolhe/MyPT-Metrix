import { Helmet } from 'react-helmet-async';
// sections
import { KpiListView } from 'src/sections/kpi/view';

// ----------------------------------------------------------------------

export default function KpiListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Kpi List</title>
      </Helmet>

      <KpiListView />
    </>
  );
}
