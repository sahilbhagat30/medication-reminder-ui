import { useNavigate } from 'react-router-dom';
import {
  summaryMetrics, channelBreakdown, dailyChartData
} from '../data/mockData';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, Pill, Users, Send, TrendingUp, AlertCircle,
  Clock, CheckCircle2, ArrowLeft, Download, RefreshCw,
  MessageSquare, Mail, Bell, XCircle
} from 'lucide-react';
import './SummaryDashboard.css';

const KPICard = ({ title, value, sub, icon: Icon, color, bg, trend }) => (
  <div className="kpi-card card">
    <div className="kpi-header">
      <div className="kpi-icon" style={{ background: bg, color }}>
        <Icon size={22} />
      </div>
      {trend !== undefined && (
        <span className={`kpi-trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'}`}>
          <TrendingUp size={12} />
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-title">{title}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

const ChannelCard = ({ data }) => {
  const successRate = data.sent > 0 ? Math.round((data.delivered / data.sent) * 100) : 0;
  const channelIcons = { SMS: MessageSquare, Email: Mail, Push: Bell };
  const Icon = channelIcons[data.channel] || MessageSquare;

  return (
    <div className="channel-card card">
      <div className="channel-card-header">
        <div className="channel-icon-badge">
          <Icon size={18} />
        </div>
        <div>
          <div className="channel-name">{data.channel}</div>
          <div className="channel-sent">{data.sent.toLocaleString()} sent</div>
        </div>
        <span className="channel-rate">{successRate}%</span>
      </div>
      <div className="channel-bar-track">
        <div className="channel-bar-fill" style={{ width: `${successRate}%` }} />
      </div>
      <div className="channel-detail-row">
        <span className="channel-detail success"><CheckCircle2 size={11} /> {data.delivered.toLocaleString()} delivered</span>
        <span className="channel-detail failed"><AlertCircle size={11} /> {data.failed.toLocaleString()} failed</span>
      </div>
    </div>
  );
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

  // Derived real metrics from Excel data
  const deliveryRate = summaryMetrics.deliverySuccessRate;
  const eligibilityRate = Math.round(summaryMetrics.eligibleMembers / summaryMetrics.totalMembers * 100);

  const kpis = [
    {
      title: 'Total Prescriptions',
      value: summaryMetrics.totalPrescriptions.toLocaleString(),
      sub: `${summaryMetrics.pendingPickups.toLocaleString()} pending pickup`,
      icon: Pill, color: 'var(--aetna-purple)', bg: 'var(--aetna-purple-light)', trend: undefined,
    },
    {
      title: 'Total Members',
      value: summaryMetrics.totalMembers.toLocaleString(),
      sub: `${summaryMetrics.eligibleMembers} eligible (${eligibilityRate}%)`,
      icon: Users, color: '#059669', bg: '#ECFDF5', trend: undefined,
    },
    {
      title: 'Notifications Sent',
      value: summaryMetrics.notificationsSent.toLocaleString(),
      sub: `${summaryMetrics.failedCount} failed · ${summaryMetrics.sentCount} awaiting confirmation`,
      icon: Send, color: 'var(--status-sent)', bg: '#EFF6FF', trend: undefined,
    },
    {
      title: 'Delivery Success Rate',
      value: `${deliveryRate}%`,
      sub: `${summaryMetrics.deliveredCount} delivered of ${summaryMetrics.notificationsSent} sent`,
      icon: TrendingUp, color: '#D97706', bg: '#FFFBEB', trend: undefined,
    },
    {
      title: 'Active Campaigns',
      value: summaryMetrics.activeCampaigns.toLocaleString(),
      sub: 'Running across all channels',
      icon: Bell, color: 'var(--aetna-magenta)', bg: 'var(--aetna-magenta-light)', trend: undefined,
    },
    {
      title: 'Avg Response Time',
      value: summaryMetrics.avgResponseTime,
      sub: 'From send to member action',
      icon: Clock, color: '#7C3AED', bg: '#F5F3FF', trend: undefined,
    },
  ];

  // Delivery breakdown for quick visual
  const deliveryBreakdown = [
    { label: 'Delivered', count: summaryMetrics.deliveredCount, color: 'var(--status-success)', icon: CheckCircle2 },
    { label: 'Sent (Awaiting)', count: summaryMetrics.sentCount, color: 'var(--status-sent)', icon: Send },
    { label: 'Failed', count: summaryMetrics.failedCount, color: 'var(--status-failed)', icon: XCircle },
  ];

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><BarChart3 size={24} style={{ color: 'var(--aetna-purple)' }} /> Summary Dashboard</h1>
          <p>Complete overview of the medication reminder platform — metrics derived from real Excel dataset (150 prescriptions, 100 members, 70 notifications).</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/communication')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-outline">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary">
            <Download size={15} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
      </div>

      {/* Delivery Status Breakdown */}
      <div className="delivery-breakdown-row">
        {deliveryBreakdown.map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="delivery-stat-pill card">
            <Icon size={18} style={{ color }} />
            <div className="delivery-stat-count" style={{ color }}>{count}</div>
            <div className="delivery-stat-label">{label}</div>
          </div>
        ))}
        <div className="delivery-stat-pill card">
          <TrendingUp size={18} style={{ color: '#D97706' }} />
          <div className="delivery-stat-count" style={{ color: '#D97706' }}>{deliveryRate}%</div>
          <div className="delivery-stat-label">Success Rate</div>
        </div>
      </div>

      {/* Charts */}
      <div className="summary-charts-grid">
        {/* Area Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Notification Volume by Channel (7-Day)</h3>
            <span className="text-muted">Daily breakdown — SMS: {summaryMetrics.notificationsSent - 11} · Email: 11</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSMS"   x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--aetna-purple)"  stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="var(--aetna-purple)"  stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="gradEmail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--aetna-magenta)" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="var(--aetna-magenta)" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '1rem' }} />
                <Area type="monotone" dataKey="SMS"   stroke="var(--aetna-purple)"  fill="url(#gradSMS)"   strokeWidth={2} />
                <Area type="monotone" dataKey="Email" stroke="var(--aetna-magenta)" fill="url(#gradEmail)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Delivery Success by Channel</h3>
            <span className="text-muted">Sent vs. Delivered vs. Failed — from Notification_Output (70 records)</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="channel" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '1rem' }} />
                <Bar dataKey="sent"      fill="var(--aetna-purple)"  radius={[4,4,0,0]} />
                <Bar dataKey="delivered" fill="var(--status-success)" radius={[4,4,0,0]} />
                <Bar dataKey="failed"    fill="var(--status-failed)"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Channel breakdown cards */}
      <div className="channel-breakdown-section">
        <h3 className="section-title">Channel Performance Breakdown</h3>
        <div className="grid-3">
          {channelBreakdown.filter(c => c.sent > 0).map(ch => <ChannelCard key={ch.channel} data={ch} />)}
        </div>
      </div>

      {/* Flow Complete Banner */}
      <div className="flow-complete-banner card">
        <div className="flow-banner-left">
          <CheckCircle2 size={32} style={{ color: 'var(--status-success)' }} />
          <div>
            <h3 style={{ color: 'var(--status-success)' }}>End-to-End Flow Complete</h3>
            <p>All 5 screens of the Medication Reminder Platform demonstrated with real data from the provided Excel dataset.</p>
          </div>
        </div>
        <div className="flow-steps-mini">
          {['Prescription', 'Eligibility', 'Campaign', 'Communication', 'Summary'].map((step, i) => (
            <div key={i} className="flow-step-mini">
              <div className="flow-step-dot" />
              <span>{step}</span>
              {i < 4 && <div className="flow-step-line" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
