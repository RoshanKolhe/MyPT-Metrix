import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useUserRoles } from 'src/utils/constants';

export function RolesAuthRoute({ roles }) {
  const userRoles = useUserRoles();
  const canAccess = userRoles.some((userRole) => roles.includes(userRole));

  return canAccess ? <Outlet /> : <Navigate to="/404" />;
}

RolesAuthRoute.propTypes = {
  roles: PropTypes.array.isRequired,
};
