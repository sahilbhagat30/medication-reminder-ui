import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { communicationStatus } from '../data/mockData';
import {
  MessageSquare, CheckCircle2, XCircle, Clock, Eye,
  RefreshCw, ArrowRight, ArrowLeft, Mail, Bell, Filter
} from 'lucide-react';
import './CommunicationStatus.css';

const statusConfig = {
  Delivered: { badge: 'badge-success', icon: CheckCircle2, color: 'var(--status-success)' },
  Sent:      { badge: 'badge-sent',    icon: Eye,          color: 'var(--status-sent)'    },
  Failed:    { badge: 'badge-failed',  icon: XCircle,      color: 'var(--status-failed)'  },
  Pending:   { badge: 'badge-pending', icon: Clock,        color: 'var(--status-pending)' },
};

const channelIcons = {
  'SMS':   MessageSquare,
  'Email': Mail,
  'Push':  Bell,
};

const PAGE_SIZE = 20;

const StatusTimeline = ({ record }) => {
  const steps = [
    { label: 'Queued',    done: true,                  time: null },
    { label: 'Sent',      done: !!record.sentAt,        time: record.sentAt },
    { label: 'Delivered', done: !!record.deliveredAt,   time: record.deliveredAt },
  ];

  if (record.status === 'Failed') {
    return (
      <div className="comm-timeline">
        <div className="timeline-step done"><span className="tl-dot done" /><span className="tl-label">Queued</span></div>
        <div className="timeline-connector failed" />
        <div className="timeline-step error"><span className="tl-dot error" /><span className="tl-label">Failed</span></div>
        <div className="tl-fail-reason">
          <XCircle size={12} /> {record.failureReason}
          {record.failureCode && <span className="retry-badge">{record.failureCode}</span>}
          {record.retryCount > 0 && <span className="retry-badge">{record.retryCount} retries</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="comm-timeline">
      {steps.map((step, i) => (
        <div key={i} className="timeline-item">
          <div className="timeline-step-container">
            <div className={`tl-dot ${step.done ? 'done' : ''}`} />
            <div className="tl-step-text">
              <span className={`tl-label ${step.done ? 'active' : ''}`}>{step.label}</span>
              {step.time && <span className="tl-time">{step.time}</span>}
            </div>
          </div>
          {i < steps.length - 1 && <div className={`timeline-connector ${step.done ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
};

const CommunicationStatus = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);

  const statusCounts = Object.keys(statusConfig).reduce((acc, s) => {
    acc[s] = communicationStatus.filter(r => r.status === s).length;
    return acc;
  }, {});

  const filtered = communicationStatus.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const handleStatusFilter = (s) => { setStatusFilter(s); setPage(1); setExpanded(null); };

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><MessageSquare size={24} style={{ color: 'var(--aetna-purple)' }} /> Communication Status</h1>
          <p>Track delivery status of all <strong>{communicationStatus.length}</strong> notifications from the Notification_Output dataset. Real-time delivery tracking across SMS and Email channels.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/campaign')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/summary')}>
            View Summary <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="comm-status-summary">
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div
              key={status}
              className={`comm-stat-card card ${statusFilter === status ? 'active-stat' : ''}`}
              onClick={() => handleStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <div className="comm-stat-icon" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                <Icon size={18} />
              </div>
              <div className="comm-stat-count">{statusCounts[status] || 0}</div>
              <div className="comm-stat-label">{status}</div>
            </div>
          );
        })}
        <div className="comm-stat-card card">
          <div className="comm-stat-icon" style={{ background: '#7C3AED18', color: '#7C3AED' }}>
            <MessageSquare size={18} />
          </div>
          <div className="comm-stat-count">{communicationStatus.length}</div>
          <div className="comm-stat-label">Total</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="comm-filter-bar">
        <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
        <span className="comm-filter-label">Filter:</span>
        <button className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => handleStatusFilter('all')}>All</button>
        {Object.keys(statusConfig).map(s => (
          <button
            key={s}
            className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => handleStatusFilter(statusFilter === s ? 'all' : s)}
          >{s}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {filtered.length} records
        </span>
      </div>

      {/* Status Table */}
      <div className="card comm-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Notification ID</th>
                <th>Member</th>
                <th>Prescription</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Reminder #</th>
                <th>Sent At</th>
                <th>Delivered At</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(record => {
                const cfg = statusConfig[record.status] || statusConfig.Pending;
                const StatusIcon = cfg.icon;
                const ChannelIcon = channelIcons[record.channel] || MessageSquare;
                const isExpanded = expanded === record.notifId;

                return (
                  <>
                    <tr key={record.notifId} className="comm-row" onClick={() => setExpanded(isExpanded ? null : record.notifId)}>
                      <td>
                        <span className="notif-id-badge">{record.notifId}</span>
                      </td>
                      <td>
                        <div className="comm-member-cell">
                          <div className="member-avatar-sm">
                            {record.memberName.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <div className="fw-600">{record.memberName}</div>
                            <div className="text-muted">{record.memberId}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-sm">{record.drug}</span></td>
                      <td>
                        <div className="channel-cell">
                          <ChannelIcon size={14} style={{ color: 'var(--aetna-purple)' }} />
                          <span className="text-sm">{record.channel}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${cfg.badge}`}>
                          <StatusIcon size={12} /> {record.status}
                        </span>
                      </td>
                      <td>
                        <span className="reminder-seq-badge">#{record.reminderSequence || 1}</span>
                      </td>
                      <td><span className="text-sm text-muted">{record.sentAt || '—'}</span></td>
                      <td><span className="text-sm text-muted">{record.deliveredAt || '—'}</span></td>
                      <td>
                        <div className="comm-actions">
                          <button className="btn btn-outline btn-sm">
                            {isExpanded ? 'Hide' : 'Timeline'}
                          </button>
                          {record.status === 'Failed' && (
                            <button className="btn btn-sm" style={{ background: 'var(--status-bg-failed)', color: 'var(--status-failed)', border: 'none' }}>
                              <RefreshCw size={12} /> Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${record.notifId}-timeline`} className="timeline-row">
                        <td colSpan={9}>
                          <div className="timeline-wrapper fade-in">
                            <StatusTimeline record={record} />
                            {record.failureReason && (
                              <div className="failure-detail">
                                <XCircle size={14} style={{ color: 'var(--status-failed)' }} />
                                <strong>failure_reason:</strong> {record.failureReason}
                                {record.failureCode && <span className="retry-badge-inline">failure_code: {record.failureCode}</span>}
                                <span className="retry-badge-inline">{record.retryCount} retries attempted</span>
                              </div>
                            )}
                            {record.suppressionReason && (
                              <div className="suppression-detail">
                                <strong>suppression_reason:</strong> {record.suppressionReason}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {paginated.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={40} style={{ color: 'var(--text-light)' }} />
              <p>No records match the selected filter.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination-row">
          <span className="pagination-info">
            Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button className="btn btn-outline btn-sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page<=3 ? i+1 : page-2+i;
              if (p<1||p>totalPages) return null;
              return <button key={p} className={`btn btn-sm ${p===page?'btn-primary':'btn-outline'}`} onClick={()=>setPage(p)}>{p}</button>;
            })}
            <button className="btn btn-outline btn-sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationStatus;
