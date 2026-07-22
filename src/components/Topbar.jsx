import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import './Topbar.css';

const routeTitles = {
  '/':               'Prescriptions',
  '/eligibility':   'Eligibility',
  '/campaign':      'Campaign',
  '/communication': 'Communication',
  '/summary':       'Summary',
};

const Topbar = () => {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Med Reminder';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span className="breadcrumb-app">Aetna Med Reminder</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-page">{pageTitle}</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={15} className="search-icon" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>

        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        <div className="topbar-user">
          <div className="user-avatar">SB</div>
          <div className="user-info">
            <span className="user-name">Sahil Bhagat</span>
            <span className="user-role">Platform Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
