import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/',              label: 'Prescriptions',       icon: LayoutDashboard, step: '01' },
  { path: '/eligibility',  label: 'Eligibility Review',  icon: ShieldCheck,     step: '02' },
  { path: '/campaign',     label: 'Campaign Preview',    icon: Megaphone,       step: '03' },
  { path: '/communication',label: 'Comm. Status',        icon: MessageSquare,   step: '04' },
  { path: '/summary',      label: 'Summary Dashboard',   icon: BarChart3,       step: '05' },
];

const Sidebar = () => {
  const location = useLocation();
  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-heart">
          <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C11 19 1 12.5 1 6.5C1 3.46 3.46 1 6.5 1C8.24 1 9.8 1.82 11 3.09C12.2 1.82 13.76 1 15.5 1C18.54 1 21 3.46 21 6.5C21 12.5 11 19 11 19Z"
              fill="white" stroke="white" strokeWidth="0.5"/>
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-aetna">aetna</span>
          <span className="logo-sub">Med Reminder</span>
        </div>
      </div>

      <div className="sidebar-section-label">USER FLOW</div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isCompleted = idx < activeIndex;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="nav-step-badge">{item.step}</div>
              <Icon size={17} className="nav-icon" />
              <span>{item.label}</span>
              {isCompleted && (
                <svg className="nav-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="7" fill="#0A8754"/>
                  <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <div className="footer-avatar">SB</div>
          <div className="footer-user">
            <span className="footer-name">Sahil Bhagat</span>
            <span className="footer-role">Platform Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
