import { Helmet } from 'react-helmet-async';
// sections
import { SaleCreateView } from 'src/sections/sale/view';

// ----------------------------------------------------------------------

export default function SaleCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new sale</title>
      </Helmet>

      <SaleCreateView />
    </>
  );
}
