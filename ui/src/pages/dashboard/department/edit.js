import { Helmet } from 'react-helmet-async';
// sections
import DepartmentEditView from 'src/sections/department/view/department-edit-view';

// ----------------------------------------------------------------------

export default function DepartmentEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Department Edit</title>
      </Helmet>

      <DepartmentEditView />
    </>
  );
}
