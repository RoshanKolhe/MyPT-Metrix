import { Helmet } from 'react-helmet-async';
// sections
import { ConductionCreateView } from 'src/sections/conduction/view';

// ----------------------------------------------------------------------

export default function ConductionCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new conduction</title>
      </Helmet>

      <ConductionCreateView />
    </>
  );
}
