import { Helmet } from 'react-helmet-async';
// sections
import { BranchCreateView } from 'src/sections/branch/view';

// ----------------------------------------------------------------------

export default function BranchCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new branch</title>
      </Helmet>

      <BranchCreateView />
    </>
  );
}
