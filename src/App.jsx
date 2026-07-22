import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import PrescriptionDashboard from './pages/PrescriptionDashboard';
import EligibilityReview from './pages/EligibilityReview';
import CampaignPreview from './pages/CampaignPreview';
import CommunicationStatus from './pages/CommunicationStatus';
import SummaryDashboard from './pages/SummaryDashboard';
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
              <Route path="/"               element={<PrescriptionDashboard />} />
              <Route path="/eligibility"    element={<EligibilityReview />} />
              <Route path="/campaign"       element={<CampaignPreview />} />
              <Route path="/communication"  element={<CommunicationStatus />} />
              <Route path="/summary"        element={<SummaryDashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
