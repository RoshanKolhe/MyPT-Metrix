import { Helmet } from 'react-helmet-async';
// sections
import DepartmentView from 'src/sections/department/view/department-view';

// ----------------------------------------------------------------------

export default function DepartmentViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Department View</title>
      </Helmet>

      <DepartmentView />
    </>
  );
}
