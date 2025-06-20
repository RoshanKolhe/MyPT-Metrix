import { Helmet } from 'react-helmet-async';
// sections
import BranchEditView from 'src/sections/branch/view/branch-edit-view';

// ----------------------------------------------------------------------

export default function BranchEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Branch Edit</title>
      </Helmet>

      <BranchEditView />
    </>
  );
}
