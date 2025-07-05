import { Helmet } from 'react-helmet-async';
// sections
import { ConductionListView } from 'src/sections/conduction/view';

// ----------------------------------------------------------------------

export default function ConductionListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Conduction List</title>
      </Helmet>

      <ConductionListView />
    </>
  );
}
