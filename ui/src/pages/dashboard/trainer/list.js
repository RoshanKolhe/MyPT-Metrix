import { Helmet } from 'react-helmet-async';
// sections
import { TrainerListView } from 'src/sections/trainer/view';

// ----------------------------------------------------------------------

export default function TrainerListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Trainer List</title>
      </Helmet>

      <TrainerListView />
    </>
  );
}
