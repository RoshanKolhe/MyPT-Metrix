import { Helmet } from 'react-helmet-async';
// sections
import BranchView from 'src/sections/branch/view/branch-view';

// ----------------------------------------------------------------------

export default function BranchViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Branch View</title>
      </Helmet>

      <BranchView />
    </>
  );
}
