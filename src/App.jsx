/**
 * src/App.jsx
 *
 * Root component for the Medication Reminder UI.
 * Sets up React Router and defines the main layout (Sidebar + Topbar)
 * wrapping the 5 core dashboard views.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar, Topbar } from '@/components';
import {
  PrescriptionDashboard,
  EligibilityReview,
  CampaignPreview,
  CommunicationStatus,
  SummaryDashboard,
} from '@/pages';
import { ROUTES } from '@/constants/routes';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <Topbar />
          <main className="content">
            <Routes>
              <Route path={ROUTES.PRESCRIPTION_DASHBOARD} element={<PrescriptionDashboard />} />
              <Route path={ROUTES.ELIGIBILITY_REVIEW}     element={<EligibilityReview />} />
              <Route path={ROUTES.CAMPAIGN_PREVIEW}       element={<CampaignPreview />} />
              <Route path={ROUTES.COMMUNICATION_STATUS}   element={<CommunicationStatus />} />
              <Route path={ROUTES.SUMMARY_DASHBOARD}      element={<SummaryDashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
