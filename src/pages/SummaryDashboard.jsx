import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSummary } from '../services/api';
import { summaryMetrics as defaultMetrics, channelBreakdown as defaultChannelBreakdown, dailyChartData as defaultDailyData } from '../data/mockData';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  BarChart3, Pill, Users, Send, TrendingUp, AlertCircle,
  Clock, CheckCircle2, ArrowLeft, Download, RefreshCw,
  MessageSquare, Mail, Bell, XCircle, Activity, Image, FileText
} from 'lucide-react';
import { exportElementAsPDF, exportElementAsPNG } from '../utils/exportUtils';
import './SummaryDashboard.css';

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="tooltip-value">
            {p.name}: <strong>{p.value.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SummaryDashboard = () => {
  const navigate = useNavigate();
  const snapshotTime   = useMemo(() => formatTimestamp(), []);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [summaryMetrics, setSummaryMetrics]     = useState(defaultMetrics);
  const [channelBreakdown, setChannelBreakdown] = useState(defaultChannelBreakdown);
  const [dailyChartData, setDailyChartData]     = useState(defaultDailyData);

  useEffect(() => {
    fetchSummary().then(data => {
      if (data?.metrics) setSummaryMetrics(data.metrics);
      if (data?.channelBreakdown) setChannelBreakdown(data.channelBreakdown);
      if (data?.dailyChartData)   setDailyChartData(data.dailyChartData);
    });
  }, []);

  const handleExport = async (type) => {
    setShowExportMenu(false);
    setExporting(true);
    try {
      if (type === 'pdf') await exportElementAsPDF('summary-dashboard-content', 'Aetna_Summary_Dashboard');
      if (type === 'png') await exportElementAsPNG('summary-dashboard-content', 'Aetna_Summary_Dashboard');
    } finally {
      setExporting(false);
    }
  };

  const deliveryRate     = summaryMetrics.deliverySuccessRate;
  const eligibilityRate  = Math.round((summaryMetrics.eligibleMembers / summaryMetrics.totalMembers) * 100) || 0;
  const failureRate      = Math.round((summaryMetrics.failedCount / summaryMetrics.notificationsSent) * 100) || 0;

  // ── Donut data ─────────────────────────────────────────────────────────────
  const donutData = [
    { name: 'Delivered',      value: summaryMetrics.deliveredCount, color: '#059669' },
    { name: 'Sent (Pending)', value: summaryMetrics.sentCount,      color: '#3B82F6' },
    { name: 'Failed',         value: summaryMetrics.failedCount,    color: '#EF4444' },
  ];

  // ── Channel icons lookup ───────────────────────────────────────────────────
  const channelMeta = {
    SMS:   { icon: MessageSquare, color: '#7C3AED', bg: '#F5F3FF' },
    Email: { icon: Mail,          color: '#059669', bg: '#ECFDF5' },
    Push:  { icon: Bell,          color: '#D97706', bg: '#FFFBEB' },
  };

  return (
    <div className="page fade-in-up" id="summary-dashboard-content">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><BarChart3 size={24} style={{ color: 'var(--aetna-purple)' }} /> Summary Dashboard</h1>
          <p>Executive analytics for the Aetna Medication Reminder Platform — delivery rates, channel performance, and prescription pickup metrics.</p>
          <div className="snapshot-label">
            <Clock size={12} /> Snapshot as of <strong>{snapshotTime}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/communication')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-outline">
            <RefreshCw size={15} /> Refresh
          </button>
          <div className="export-dropdown-wrapper">
            <button
              className="btn btn-primary"
              onClick={() => setShowExportMenu(v => !v)}
              disabled={exporting}
            >
              <Download size={15} /> {exporting ? 'Exporting…' : 'Export'}
            </button>
            {showExportMenu && (
              <div className="export-dropdown-menu">
                <button className="export-dropdown-item" onClick={() => handleExport('pdf')}>
                  <FileText size={14} /> Download as PDF
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('png')}>
                  <Image size={14} /> Download as PNG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 1: 4 Headline KPI Cards ──────────────────────────────────── */}
      <div className="sum-kpi-row">
        <div className="sum-kpi-card card">
          <div className="sum-kpi-icon" style={{ background: 'var(--aetna-purple-light)', color: 'var(--aetna-purple)' }}>
            <Pill size={20} />
          </div>
          <div className="sum-kpi-body">
            <div className="sum-kpi-value" style={{ color: 'var(--aetna-purple)' }}>{summaryMetrics.totalPrescriptions.toLocaleString()}</div>
            <div className="sum-kpi-label">Total Prescriptions</div>
            <div className="sum-kpi-sub">{summaryMetrics.pendingPickups} pending pickup</div>
          </div>
        </div>
        <div className="sum-kpi-card card">
          <div className="sum-kpi-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <Users size={20} />
          </div>
          <div className="sum-kpi-body">
            <div className="sum-kpi-value" style={{ color: '#059669' }}>{summaryMetrics.totalMembers.toLocaleString()}</div>
            <div className="sum-kpi-label">Total Members</div>
            <div className="sum-kpi-sub">{summaryMetrics.eligibleMembers} eligible ({eligibilityRate}%)</div>
          </div>
        </div>
        <div className="sum-kpi-card card">
          <div className="sum-kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <Send size={20} />
          </div>
          <div className="sum-kpi-body">
            <div className="sum-kpi-value" style={{ color: '#3B82F6' }}>{summaryMetrics.notificationsSent.toLocaleString()}</div>
            <div className="sum-kpi-label">Notifications Sent</div>
            <div className="sum-kpi-sub">{summaryMetrics.deliveredCount} delivered · {summaryMetrics.failedCount} failed</div>
          </div>
        </div>
        <div className="sum-kpi-card card">
          <div className="sum-kpi-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <TrendingUp size={20} />
          </div>
          <div className="sum-kpi-body">
            <div className="sum-kpi-value" style={{ color: '#D97706' }}>{deliveryRate}%</div>
            <div className="sum-kpi-label">Delivery Success Rate</div>
            <div className="sum-kpi-sub">{failureRate}% failure rate</div>
          </div>
        </div>
        <div className="sum-kpi-card card">
          <div className="sum-kpi-icon" style={{ background: 'var(--aetna-magenta-light)', color: 'var(--aetna-magenta)' }}>
            <Bell size={20} />
          </div>
          <div className="sum-kpi-body">
            <div className="sum-kpi-value" style={{ color: 'var(--aetna-magenta)' }}>{summaryMetrics.activeCampaigns}</div>
            <div className="sum-kpi-label">Active Campaigns</div>
            <div className="sum-kpi-sub">Across all channels</div>
          </div>
        </div>
        <div className="sum-kpi-card card">
          <div className="sum-kpi-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <Clock size={20} />
          </div>
          <div className="sum-kpi-body">
            <div className="sum-kpi-value" style={{ color: '#7C3AED' }}>{summaryMetrics.avgResponseTime}</div>
            <div className="sum-kpi-label">Avg Response Time</div>
            <div className="sum-kpi-sub">From send to action</div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Area Chart (wide) + Donut (narrow) ────────────────────── */}
      <div className="sum-charts-row">
        {/* Area Chart */}
        <div className="card sum-area-card">
          <div className="sum-chart-header">
            <div>
              <h3>Notification Volume by Channel</h3>
              <span className="text-muted">7-day daily breakdown across SMS &amp; Email</span>
            </div>
            <div className="sum-legend-pills">
              <span className="sum-legend-pill" style={{ '--c': 'var(--aetna-purple)' }}>SMS</span>
              <span className="sum-legend-pill" style={{ '--c': 'var(--aetna-magenta)' }}>Email</span>
            </div>
          </div>
          <div className="sum-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSMS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--aetna-purple)"  stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--aetna-purple)"  stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="gradEmail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--aetna-magenta)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--aetna-magenta)" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="SMS"   stroke="var(--aetna-purple)"  fill="url(#gradSMS)"   strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="Email" stroke="var(--aetna-magenta)" fill="url(#gradEmail)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="card sum-donut-card">
          <div className="sum-chart-header">
            <div>
              <h3>Delivery Breakdown</h3>
              <span className="text-muted">{summaryMetrics.notificationsSent} total notifications</span>
            </div>
          </div>
          <div className="sum-donut-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val.toLocaleString(), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sum-donut-legend">
              {donutData.map(d => (
                <div key={d.name} className="sum-donut-legend-item">
                  <span className="sum-donut-dot" style={{ background: d.color }} />
                  <span className="sum-donut-name">{d.name}</span>
                  <span className="sum-donut-val" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Bar Chart + Channel Performance Cards ─────────────────── */}
      <div className="sum-bottom-row">
        {/* Bar chart */}
        <div className="card sum-bar-card">
          <div className="sum-chart-header">
            <div>
              <h3>Channel Delivery Comparison</h3>
              <span className="text-muted">Sent vs. Delivered vs. Failed per channel</span>
            </div>
          </div>
          <div className="sum-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="channel" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.75rem' }} />
                <Bar dataKey="sent"      fill="var(--aetna-purple)"  radius={[4,4,0,0]} />
                <Bar dataKey="delivered" fill="#059669"              radius={[4,4,0,0]} />
                <Bar dataKey="failed"    fill="#EF4444"              radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel performance stack */}
        <div className="sum-channel-stack">
          <h3 className="sum-section-title"><Activity size={16} /> Channel Performance</h3>
          {channelBreakdown.filter(c => c.sent > 0).map(data => {
            const rate  = data.sent > 0 ? Math.round((data.delivered / data.sent) * 100) : 0;
            const meta  = channelMeta[data.channel] || channelMeta.SMS;
            const Icon  = meta.icon;
            return (
              <div key={data.channel} className="card sum-channel-card">
                <div className="sum-channel-top">
                  <div className="sum-channel-icon" style={{ background: meta.bg, color: meta.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="sum-channel-info">
                    <span className="sum-channel-name">{data.channel}</span>
                    <span className="sum-channel-sent">{data.sent} sent</span>
                  </div>
                  <span className="sum-channel-rate" style={{ color: meta.color }}>{rate}%</span>
                </div>
                <div className="sum-channel-track">
                  <div className="sum-channel-fill" style={{ width: `${rate}%`, background: meta.color }} />
                </div>
                <div className="sum-channel-stats">
                  <span style={{ color: '#059669' }}><CheckCircle2 size={11} /> {data.delivered} delivered</span>
                  <span style={{ color: '#EF4444' }}><XCircle size={11} /> {data.failed} failed</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
