import { Helmet } from 'react-helmet-async';
// sections
import TargetEditView from 'src/sections/target/view/target-edit-view';

// ----------------------------------------------------------------------

export default function TargetEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Target Edit</title>
      </Helmet>

      <TargetEditView />
    </>
  );
}
