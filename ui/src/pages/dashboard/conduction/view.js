import { Helmet } from 'react-helmet-async';
// sections
import ConductionView from 'src/sections/conduction/view/conduction-view';

// ----------------------------------------------------------------------

export default function ConductionViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Conduction View</title>
      </Helmet>

      <ConductionView />
    </>
  );
}
