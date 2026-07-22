import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptions } from '../data/mockData';
import {
  Pill, Store, Calendar, CheckCircle2, Clock, ArrowRight,
  Filter, Search, ChevronRight, ChevronLeft, ChevronRight as ChevRight
} from 'lucide-react';
import './PrescriptionDashboard.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PICKUP_STATUS_CONFIG = {
  'Pending Pickup': { cls: 'badge-pending',  label: 'Pending Pickup' },
  'In Process':     { cls: 'badge-inprocess',label: 'In Process' },
  'Picked Up':      { cls: 'badge-success',  label: 'Picked Up' },
  'Cancelled':      { cls: 'badge-failed',   label: 'Cancelled' },
};

const PAGE_SIZE = 15;

const PrescriptionDashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  const filtered = prescriptions.filter(rx => {
    const matchFilter =
      filter === 'all'     ||
      (filter === 'ready'  && rx.readyForPickup) ||
      (filter === 'pending' && !rx.readyForPickup);
    const q = search.toLowerCase();
    const matchSearch =
      rx.memberName.toLowerCase().includes(q) ||
      rx.drugName.toLowerCase().includes(q)   ||
      rx.id.toLowerCase().includes(q)         ||
      rx.memberId.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const readyCount   = prescriptions.filter(r => r.readyForPickup).length;
  const pendingCount = prescriptions.filter(r => !r.readyForPickup).length;

  const handleFilterChange = (f) => { setFilter(f); setPage(1); };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><Pill size={24} style={{ color: 'var(--aetna-purple)' }} /> Prescription Dashboard</h1>
          <p>Monitor all prescription records and their pickup status at CVS stores. Showing data from <strong>150 prescriptions</strong> across 100 members.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/eligibility')}>
          Review Eligibility <ArrowRight size={15} />
        </button>
      </div>

      {/* Summary Chips */}
      <div className="rx-summary-chips">
        <div className={`chip chip-all ${filter==='all'?'chip-active':''}`} onClick={() => handleFilterChange('all')}>
          <span className="chip-count">{prescriptions.length}</span>
          <span>Total Rx</span>
        </div>
        <div className={`chip chip-ready ${filter==='ready'?'chip-active':''}`} onClick={() => handleFilterChange('ready')}>
          <CheckCircle2 size={16} />
          <span className="chip-count">{readyCount}</span>
          <span>Ready for Pickup</span>
        </div>
        <div className={`chip chip-pending ${filter==='pending'?'chip-active':''}`} onClick={() => handleFilterChange('pending')}>
          <Clock size={16} />
          <span className="chip-count">{pendingCount}</span>
          <span>Processing</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="rx-filters-row">
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
        <div className="filter-tabs">
          {['all', 'ready', 'pending'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => handleFilterChange(f)}
            >
              {f === 'all' ? 'All' : f === 'ready' ? 'Ready' : 'Processing'}
            </button>
          ))}
        </div>
        <div className="filter-info">
          <Filter size={13} />
          <span>{filtered.length} records</span>
        </div>
      </div>

      {/* Table */}
      <div className="card rx-table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Rx ID</th>
                <th>Member</th>
                <th>Drug / Strength</th>
                <th>CVS Store</th>
                <th>Pickup Status</th>
                <th>Pickup Deadline</th>
                <th>Prescriber / Specialty</th>
                <th>Plan Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(rx => {
                const statusCfg = PICKUP_STATUS_CONFIG[rx.pickupStatus] || PICKUP_STATUS_CONFIG['In Process'];
                return (
                  <tr key={rx.id} onClick={() => navigate('/eligibility')} className="rx-row">
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
                        <div>
                          <div className="fw-600">{rx.drugName}</div>
                          <div className="text-muted">{rx.drugStrength}</div>
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
                      <span className={`badge ${statusCfg.cls}`}>
                        {rx.readyForPickup
                          ? <CheckCircle2 size={12} />
                          : <Clock size={12} />}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="deadline-cell">
                        <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                        <span className={`text-sm ${rx.pickupDeadline && new Date(rx.pickupDeadline) < new Date(Date.now() + 86400000*2) ? 'deadline-urgent' : ''}`}>
                          {formatDate(rx.pickupDeadline)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-600 text-sm">{rx.prescriber}</div>
                        <div className="text-muted">{rx.specialty}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${rx.planType==='Medicare' ? 'badge-medicare' : rx.planType==='PBM' ? 'badge-pbm' : 'badge-commercial'}`}>
                        {rx.planType || '—'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm row-action-btn">
                        Review <ChevRight size={13} />
                      </button>
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
            Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDashboard;
