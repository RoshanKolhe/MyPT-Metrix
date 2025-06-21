import { Helmet } from 'react-helmet-async';
// sections
import TrainerView from 'src/sections/trainer/view/trainer-view';

// ----------------------------------------------------------------------

export default function TrainerViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Trainer View</title>
      </Helmet>

      <TrainerView />
    </>
  );
}
