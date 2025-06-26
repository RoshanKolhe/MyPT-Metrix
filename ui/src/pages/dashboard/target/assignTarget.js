import { Helmet } from 'react-helmet-async';
// sections
import TargetAssignTrainerView from 'src/sections/target/view/target-assign-trainer-view';

// ----------------------------------------------------------------------

export default function AssignTargetViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Assign Target</title>
      </Helmet>

      <TargetAssignTrainerView />
    </>
  );
}
