import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPrescriptions } from '../services/api';
import {
  Pill, Store, Calendar, CheckCircle2, Clock, ArrowRight,
  Search, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Download
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import './PrescriptionDashboard.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
};

// Helper to mask drug name (e.g., Atorvastatin -> At****in, Eliquis -> El****is)
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

// All pickup_status categories
const STATUS_FILTERS = ['All', 'Pending Pickup', 'In Process', 'Picked Up', 'Cancelled'];

const STATUS_CARD_CONFIG = {
  'All':            { cls: 'kpi-all',      borderColor: 'var(--aetna-purple)',  icon: Pill },
  'Pending Pickup': { cls: 'kpi-pending',  borderColor: '#D97706',              icon: Clock },
  'In Process':     { cls: 'kpi-inprocess',borderColor: '#2563EB',              icon: Clock },
  'Picked Up':      { cls: 'kpi-pickedup', borderColor: '#0A8754',              icon: CheckCircle2 },
  'Cancelled':      { cls: 'kpi-cancelled',borderColor: '#DC2626',              icon: ChevronDown },
};

const PICKUP_STATUS_BADGE = {
  'Pending Pickup': 'badge-pending',
  'In Process':     'badge-sent',
  'Picked Up':      'badge-success',
  'Cancelled':      'badge-failed',
};

const PAGE_SIZE = 15;

// Sortable column header
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

const PrescriptionDashboard = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [sortField, setSortField]       = useState('pickupDeadline');
  const [sortDir, setSortDir]           = useState('asc');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);

  const snapshotTime = useMemo(() => formatTimestamp(), []);

  // Load from BFF (or mock fallback)
  useEffect(() => {
    fetchPrescriptions().then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  // KPI counts per status
  const kpiCounts = useMemo(() => {
    const counts = { All: prescriptions.length };
    STATUS_FILTERS.slice(1).forEach(s => {
      counts[s] = prescriptions.filter(r => r.pickupStatus === s).length;
    });
    return counts;
  }, [prescriptions]);

  // Filter → Search → Sort
  const filtered = useMemo(() => {
    let rows = prescriptions;
    if (statusFilter !== 'All') rows = rows.filter(r => r.pickupStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.memberName.toLowerCase().includes(q) ||
        r.drugName.toLowerCase().includes(q)   ||
        r.id.toLowerCase().includes(q)         ||
        r.memberId.toLowerCase().includes(q)
      );
    }
    // Sort
    rows = [...rows].sort((a, b) => {
      let av = a[sortField] ?? ''; let bv = b[sortField] ?? '';
      if (typeof av === 'boolean') av = av ? 1 : 0;
      if (typeof bv === 'boolean') bv = bv ? 1 : 0;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return rows;
  }, [statusFilter, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusFilter = (s) => { setStatusFilter(s); setPage(1); };
  const handleSearch       = (v) => { setSearch(v); setPage(1); };
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleExportCSV = () => {
    exportToCSV('Prescriptions', filtered, [
      { header: 'Rx ID',           key: 'id' },
      { header: 'Member ID',       key: 'memberId' },
      { header: 'Member Name',     key: 'memberName' },
      { header: 'Pickup Status',   key: 'pickupStatus' },
      { header: 'Pickup Deadline', key: 'pickupDeadline' },
      { header: 'Store',           key: 'store' },
      { header: 'Ready',           key: 'readyForPickup' },
    ]);
  };

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><Pill size={24} style={{ color: 'var(--aetna-purple)' }} /> Prescription Dashboard</h1>
          <p>
            Monitor all prescription records and their pickup status at CVS stores.&nbsp;
            <strong>{prescriptions.length} prescriptions</strong> across 100 members.
          </p>
          {/* Snapshot label */}
          <div className="snapshot-label">
            <Clock size={12} /> Snapshot as of <strong>{snapshotTime}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/eligibility')}>
            Review Eligibility <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* KPI Status Cards — matching Campaign Preview card height & design */}
      <div className="rx-kpi-cards">
        {STATUS_FILTERS.map(status => {
          const cfg = STATUS_CARD_CONFIG[status];
          const Icon = cfg.icon;
          const isActive = statusFilter === status;
          return (
            <div
              key={status}
              className={`rx-kpi-card card ${isActive ? 'rx-kpi-active' : ''}`}
              style={{ '--kpi-border': cfg.borderColor }}
              onClick={() => handleStatusFilter(status)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleStatusFilter(status)}
            >
              <div className="rx-kpi-label" style={{ color: cfg.borderColor }}>
                <Icon size={14} /> {status}
              </div>
              <div className="rx-kpi-count" style={{ color: cfg.borderColor }}>
                {kpiCounts[status]}
              </div>
              {isActive && <div className="rx-kpi-active-bar" style={{ background: cfg.borderColor }} />}
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="rx-search-row">
        <div className="filter-search-box">
          <Search size={15} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by member, drug name, Rx ID or member ID…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="filter-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card rx-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <SortHeader label="Rx ID"               field="id"             sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Member"              field="memberName"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Drug / Strength"     field="drugName"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="CVS Store"           field="storeName"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Pickup Status"       field="pickupStatus"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Pickup Deadline"     field="pickupDeadline" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Prescriber"         field="prescriber"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Plan Type"           field="planType"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {paginated.map(rx => {
                const badgeCls = PICKUP_STATUS_BADGE[rx.pickupStatus] || 'badge-pending';
                const isUrgent = rx.pickupDeadline && new Date(rx.pickupDeadline) < new Date(Date.now() + 86400000 * 2);
                return (
                  <tr key={rx.id} className="rx-row">
                    <td>
                      <span className="rx-id-badge">{rx.id}</span>
                    </td>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">{rx.memberName.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <div className="fw-600">{rx.memberName}</div>
                          <div className="text-muted">{rx.memberId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="drug-cell">
                        <Pill size={14} style={{ color: 'var(--aetna-purple)', flexShrink: 0 }} />
                        <div className="drug-container-pill">
                          <span className="drug-name">{maskText(rx.drugName)}</span>
                          <span className="drug-strength-pill">{rx.drugStrength}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="store-cell">
                        <Store size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        <span className="text-sm">{rx.storeName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeCls}`}>
                        {rx.readyForPickup ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {rx.pickupStatus}
                      </span>
                    </td>
                    <td>
                      <div className="deadline-cell">
                        <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                        <span className={`text-sm ${isUrgent ? 'deadline-urgent' : ''}`}>
                          {formatDate(rx.pickupDeadline)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-600 text-sm">{rx.prescriber}</div>
                      <div className="text-muted">{rx.specialty}</div>
                    </td>
                    <td>
                      <span className={`badge ${rx.planType === 'Medicare' ? 'badge-medicare' : rx.planType === 'PBM' ? 'badge-pbm' : 'badge-commercial'}`}>
                        {rx.planType || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginated.length === 0 && (
            <div className="empty-state">
              <Pill size={40} style={{ color: 'var(--text-light)' }} />
              <p>No prescriptions match your filters.</p>
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

export default PrescriptionDashboard;
