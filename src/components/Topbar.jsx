import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import './Topbar.css';

const routeTitles = {
  '/':              { title: 'Prescription Dashboard', step: 'Step 1 of 5' },
  '/eligibility':  { title: 'Eligibility Review',     step: 'Step 2 of 5' },
  '/campaign':     { title: 'Campaign Preview',        step: 'Step 3 of 5' },
  '/communication':{ title: 'Communication Status',   step: 'Step 4 of 5' },
  '/summary':      { title: 'Summary Dashboard',      step: 'Step 5 of 5' },
};

const Topbar = () => {
  const location = useLocation();
  const info = routeTitles[location.pathname] || { title: 'Med Reminder', step: '' };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span className="breadcrumb-app">Aetna Med Reminder</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-page">{info.title}</span>
        </div>
        {info.step && <span className="topbar-step-badge">{info.step}</span>}
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
