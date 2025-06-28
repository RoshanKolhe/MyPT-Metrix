import { Helmet } from 'react-helmet-async';
// sections
import { KpiCreateView } from 'src/sections/kpi/view';

// ----------------------------------------------------------------------

export default function KpiCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new kpi</title>
      </Helmet>

      <KpiCreateView />
    </>
  );
}
