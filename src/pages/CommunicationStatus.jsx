import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { communicationStatus } from '../data/mockData';
import {
  MessageSquare, CheckCircle2, XCircle, Clock, Eye,
  RefreshCw, ArrowRight, ArrowLeft, Mail, Bell,
  ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Download
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import './CommunicationStatus.css';

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
};

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

// Helper to mask drug name
const maskText = (str) => {
  if (!str) return '—';
  const words = str.split(' ');
  return words.map(w => {
    if (w.length <= 3) return w[0] + '*'.repeat(Math.max(1, w.length - 1));
    const start = w.slice(0, 2);
    const end = w.slice(-2);
    return `${start}****${end}`;
  }).join(' ');
};

const PAGE_SIZE = 15;

// Sortable column header component matching PrescriptionDashboard style
const SortHeader = ({ label, field, sortField, sortDir, onSort, align }) => {
  const active = sortField === field;
  const isCenter = align === 'center';
  return (
    <th 
      className="sortable-th" 
      onClick={() => onSort(field)}
      style={{ textAlign: isCenter ? 'center' : 'left' }}
    >
      <span className="sort-th-inner" style={{ justifyContent: isCenter ? 'center' : 'flex-start' }}>
        {label}
        <span className="sort-icons">
          {active ? (
            sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
          ) : (
            <ChevronsUpDown size={13} style={{ opacity: 0.35 }} />
          )}
        </span>
      </span>
    </th>
  );
};

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
  const [expanded, setExpanded]         = useState(null);
  const [page, setPage]                 = useState(1);
  const [sortField, setSortField]       = useState('notifId');
  const [sortDir, setSortDir]           = useState('asc');

  const snapshotTime = useMemo(() => formatTimestamp(), []);

  const statusCounts = useMemo(() => {
    return Object.keys(statusConfig).reduce((acc, s) => {
      acc[s] = communicationStatus.filter(r => r.status === s).length;
      return acc;
    }, {});
  }, []);

  // Filter + Sort
  const filtered = useMemo(() => {
    let rows = communicationStatus;
    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.status === statusFilter);
    }
    rows = [...rows].sort((a, b) => {
      let av = a[sortField] ?? ''; let bv = b[sortField] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return rows;
  }, [statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusFilter = (s) => { setStatusFilter(s); setPage(1); setExpanded(null); };
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleExportCSV = () => {
    exportToCSV('Communication_Status', filtered, [
      { header: 'Notification ID',   key: 'notifId' },
      { header: 'Member ID',         key: 'memberId' },
      { header: 'Member Name',       key: 'memberName' },
      { header: 'Channel',           key: 'channel' },
      { header: 'Status',            key: 'status' },
      { header: 'Reminder #',        key: 'reminderSequence' },
      { header: 'Sent At',           key: 'sentAt' },
      { header: 'Delivered At',      key: 'deliveredAt' },
      { header: 'Failure Reason',    key: 'failureReason' },
    ]);
  };

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><MessageSquare size={24} style={{ color: 'var(--aetna-purple)' }} /> Communication Status</h1>
          <p>Track delivery status of all <strong>{communicationStatus.length}</strong> notifications from the Notification_Output dataset.</p>
          <div className="snapshot-label">
            <Clock size={12} /> Snapshot as of <strong>{snapshotTime}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/campaign')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/summary')}>
            View Summary <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="rx-kpi-cards">
        <div
          className={`rx-kpi-card card ${statusFilter === 'all' ? 'rx-kpi-active' : ''}`}
          onClick={() => handleStatusFilter('all')}
          style={{ '--kpi-border': 'var(--aetna-purple)' }}
          role="button" tabIndex={0}
        >
          <div className="rx-kpi-label" style={{ color: 'var(--aetna-purple)' }}>
            <MessageSquare size={14} /> Total
          </div>
          <div className="rx-kpi-count" style={{ color: 'var(--aetna-purple)' }}>{communicationStatus.length}</div>
          {statusFilter === 'all' && <div className="rx-kpi-active-bar" style={{ background: 'var(--aetna-purple)' }} />}
        </div>
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const Icon = cfg.icon;
          const isActive = statusFilter === status;
          return (
            <div
              key={status}
              className={`rx-kpi-card card ${isActive ? 'rx-kpi-active' : ''}`}
              onClick={() => handleStatusFilter(statusFilter === status ? 'all' : status)}
              style={{ '--kpi-border': cfg.color }}
              role="button" tabIndex={0}
            >
              <div className="rx-kpi-label" style={{ color: cfg.color }}>
                <Icon size={14} /> {status}
              </div>
              <div className="rx-kpi-count" style={{ color: cfg.color }}>
                {statusCounts[status] || 0}
              </div>
              {isActive && <div className="rx-kpi-active-bar" style={{ background: cfg.color }} />}
            </div>
          );
        })}
      </div>

      {/* Status Table matching PrescriptionDashboard style */}
      <div className="card rx-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <SortHeader label="Notification ID" field="notifId"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Member"          field="memberName"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Prescription"    field="drug"             sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Channel"         field="channel"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Status"          field="status"           sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Reminder #"      field="reminderSequence" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortHeader label="Sent At"         field="sentAt"           sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Delivered At"    field="deliveredAt"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={{ textAlign: 'center' }}>Details</th>
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
                    <tr key={record.notifId} className="rx-row" onClick={() => setExpanded(isExpanded ? null : record.notifId)}>
                      <td>
                        <span className="rx-id-badge">{record.notifId}</span>
                      </td>
                      <td>
                        <div className="member-cell">
                          <div className="member-avatar">
                            {record.memberName.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <div className="fw-600">{record.memberName}</div>
                            <div className="text-muted">{record.memberId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="drug-cell">
                          <div className="drug-container-pill" style={{ marginLeft: 0 }}>
                            <span className="drug-name">{maskText(record.drug)}</span>
                          </div>
                        </div>
                      </td>
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
                      <td className="text-center">
                        <span className="reminder-seq-badge">#{record.reminderSequence || 1}</span>
                      </td>
                      <td><span className="text-sm text-muted">{record.sentAt || '—'}</span></td>
                      <td><span className="text-sm text-muted">{record.deliveredAt || '—'}</span></td>
                      <td className="text-center">
                        <div className="comm-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn btn-outline btn-sm elig-expand-icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded(isExpanded ? null : record.notifId);
                            }}
                            title={isExpanded ? 'Hide timeline' : 'View timeline'}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
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
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationStatus;
