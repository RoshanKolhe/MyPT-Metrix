import { Helmet } from 'react-helmet-async';
// sections
import { DepartmentListView } from 'src/sections/department/view';

// ----------------------------------------------------------------------

export default function DepartmentListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Department List</title>
      </Helmet>

      <DepartmentListView />
    </>
  );
}
