import { Helmet } from 'react-helmet-async';
// sections
import { BranchListView } from 'src/sections/branch/view';

// ----------------------------------------------------------------------

export default function BranchListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Branch List</title>
      </Helmet>

      <BranchListView />
    </>
  );
}
