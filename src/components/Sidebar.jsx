import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { prescriptions, summaryMetrics } from '../data/mockData';
import './Sidebar.css';

const navItems = [
  { path: '/',               label: 'Prescriptions', icon: LayoutDashboard },
  { path: '/eligibility',   label: 'Eligibility',   icon: ShieldCheck },
  { path: '/campaign',      label: 'Campaign',       icon: Megaphone },
  { path: '/communication', label: 'Communication',  icon: MessageSquare },
  { path: '/summary',       label: 'Summary',        icon: BarChart3 },
];

// Derive persistent KPI counts from real data
const kpiStats = [
  {
    label: 'Total Rx',
    value: prescriptions.length,
    color: 'var(--aetna-purple)',
  },
  {
    label: 'Ready',
    value: prescriptions.filter(r => r.readyForPickup).length,
    color: '#0A8754',
  },
  {
    label: 'Notified',
    value: summaryMetrics.notificationsSent,
    color: '#2563EB',
  },
  {
    label: 'Delivered',
    value: summaryMetrics.deliveredCount,
    color: '#D97706',
  },
];

const Sidebar = () => {
  const location = useLocation();

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
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Persistent KPI Stats */}
      <div className="sidebar-kpi-block">
        <div className="sidebar-kpi-title">PLATFORM KPIs</div>
        <div className="sidebar-kpi-grid">
          {kpiStats.map(k => (
            <div className="sidebar-kpi-item" key={k.label}>
              <span className="sidebar-kpi-val" style={{ color: k.color }}>{k.value.toLocaleString()}</span>
              <span className="sidebar-kpi-label">{k.label}</span>
            </div>
          ))}
        </div>
      </div>

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
