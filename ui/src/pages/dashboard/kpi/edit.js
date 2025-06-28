import { Helmet } from 'react-helmet-async';
// sections
import KpiEditView from 'src/sections/kpi/view/kpi-edit-view';

// ----------------------------------------------------------------------

export default function KpiEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Kpi Edit</title>
      </Helmet>

      <KpiEditView />
    </>
  );
}
