import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import CandidatesPage from '../candidates/CandidatesPage';
import PublicApplyPage from '../candidates/PublicApplyPage';

// Podés reemplazar por tu dashboard real
function DashboardPage() {
  return <div style={{ padding: 8 }}>Dashboard</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'candidates', element: <CandidatesPage /> },
      { path: 'apply', element: <PublicApplyPage /> },
      // ¡IMPORTANTE! NADA de comodín que redirija a "/"
    ],
  },
]);
