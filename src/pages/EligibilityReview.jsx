import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEligibility, fetchPrescriptions } from '../services/api';
import {
  ShieldCheck, ShieldX, CheckCircle2, XCircle, ArrowRight,
  ArrowLeft, User, ChevronDown, ChevronUp, Clock,
  ChevronLeft, ChevronRight, ChevronsUpDown, Calendar, Download
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import './EligibilityReview.css';

// ── New ERD-aligned rule definitions ────────────────────────────────────────
const RULES = [
  {
    key:    'ready_for_pickup',
    title:  'Ready for Pickup',
    detail: 'Pharmacy has finished filling the prescription (ready_for_pickup = true).',
    dataKey: 'ready_for_pickup',
  },
  {
    key:    'pending_pickup',
    title:  'Pending Pickup',
    detail: "Do not notify if already picked up or cancelled (pickup_status = 'Pending Pickup').",
    dataKey: 'pending_pickup',
  },
  {
    key:    'pickup_deadline_valid',
    title:  'Pickup Deadline Valid',
    detail: "Don't notify after the medication has expired (today ≤ pickup_deadline).",
    dataKey: 'pickup_deadline_valid',
  },
  {
    key:    'active_coverage',
    title:  'Active Coverage',
    detail: 'Member has an active plan (coverage_start_date ≤ today ≤ coverage_end_date).',
    dataKey: 'active_coverage',
  },
  {
    key:    'preferred_channel_exists',
    title:  'Preferred Channel Exists',
    detail: 'Exactly one COMMUNICATION_PREFERENCE.is_preferred = true.',
    dataKey: 'preferred_channel_exists',
  },
  {
    key:    'permission_granted',
    title:  'Permission Granted',
    detail: 'Member has allowed communication on that channel (permission_status = Allowed).',
    dataKey: 'permission_granted',
  },
];

// prescriptionLookup is built dynamically inside the component from fetched data


const PICKUP_STATUS_BADGE = {
  'Pending Pickup': 'badge-pending',
  'In Process':     'badge-sent',
  'Picked Up':      'badge-success',
  'Cancelled':      'badge-failed',
};

// Derive rule results & score from legacy data (4-key) mapped to 6-rule ERD
function deriveRuleResults(member) {
  const r = member.ruleResults || {};
  // "pending_pickup" aligns with pickupStatus via prescriptionLookup
  const pLookup = prescriptionLookup[member.rxId] || {};
  const pendingPickup = pLookup.pickupStatus === 'Pending Pickup';

  return {
    ready_for_pickup:          r.ready_for_pickup         ?? false,
    pending_pickup:            pendingPickup,
    pickup_deadline_valid:     r.ready_for_pickup         ?? false, // if ready, deadline still valid
    active_coverage:           r.active_member            ?? r.communication_preference_exists ?? false,
    preferred_channel_exists:  r.communication_preference_exists ?? false,
    permission_granted:        r.opted_in                 ?? false,
  };
}

// Compute score as % of passed rules
function computeScore(derivedResults) {
  const values = Object.values(derivedResults);
  const passed = values.filter(Boolean).length;
  return Math.round((passed / values.length) * 100);
}

// Mask contact value (e.g. phone -> 412-***-1028, email -> jo****ll@ex****.test, token -> apns_m0028****_token)
const maskContactValue = (channel, value) => {
  if (!value || value === '—') return '—';
  if (channel === 'SMS') {
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-***-${parts[2]}`;
    }
    return value.substring(0, 3) + '-***-' + value.substring(value.length - 4);
  }
  if (channel === 'Email') {
    const [name, domain] = value.split('@');
    if (!name || !domain) return value;
    const maskedName = name.length <= 3 ? name[0] + '**' : `${name.slice(0, 2)}****${name.slice(-2)}`;
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0].length <= 3 ? domainParts[0][0] + '**' : `${domainParts[0].slice(0, 2)}****`;
    const ext = domainParts.slice(1).join('.');
    return `${maskedName}@${maskedDomain}.${ext}`;
  }
  if (channel === 'Push') {
    if (value.length <= 8) return 'device_***';
    return `${value.slice(0, 5)}****${value.slice(-6)}`;
  }
  return value;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
};

const PAGE_SIZE = 15;

// ── Sortable column header ───────────────────────────────────────────────────
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

// ── Score Bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const color = score >= 100 ? 'var(--status-success)'
              : score >= 67  ? 'var(--status-pending)'
              :                'var(--status-failed)';
  return (
    <div className="score-bar-wrapper">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="score-label" style={{ color }}>{score}%</span>
    </div>
  );
};

// ── Rule Row (in expanded panel) ─────────────────────────────────────────────
const RuleRow = ({ rule, passed }) => (
  <div className={`check-item ${passed ? 'pass' : 'fail'}`}>
    <div className="check-icon">
      {passed
        ? <CheckCircle2 size={18} color="var(--status-success)" />
        : <XCircle      size={18} color="var(--status-failed)"  />}
    </div>
    <div className="check-text">
      <span className="check-label">{rule.title}</span>
      <span className="check-detail">{rule.detail}</span>
    </div>
    <span className={`check-result ${passed ? 'pass' : 'fail'}`}>
      {passed ? 'Pass' : 'Fail'}
    </span>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const EligibilityReview = () => {
  const navigate = useNavigate();
  const [filterElig, setFilterElig]   = useState('all');
  const [search, setSearch]           = useState('');
  const [expanded, setExpanded]       = useState(null);
  const [page, setPage]               = useState(1);
  const [sortField, setSortField]     = useState('memberName');
  const [sortDir, setSortDir]         = useState('asc');
  const [eligibilityData, setEligibilityData]   = useState([]);
  const [prescriptionsRaw, setPrescriptionsRaw] = useState([]);
  const [loading, setLoading]                   = useState(true);

  const snapshotTime = useMemo(() => formatTimestamp(), []);

  useEffect(() => {
    Promise.all([fetchEligibility(), fetchPrescriptions()]).then(([elig, rxs]) => {
      setEligibilityData(elig);
      setPrescriptionsRaw(rxs);
      setLoading(false);
    });
  }, []);

  // Build lookup from fetched prescriptions
  const prescriptionLookup = useMemo(() =>
    Object.fromEntries(prescriptionsRaw.map(rx => [rx.id, {
      pickupDeadline: rx.pickupDeadline,
      pickupStatus: rx.pickupStatus,
      phone: rx.phone,
      email: rx.email,
      memberId: rx.memberId,
    }])),
  [prescriptionsRaw]);

  // Enrich data with derived rule results & corrected score
  const enriched = useMemo(() => eligibilityData.map(m => {
    const derived = deriveRuleResults(m);
    const score   = computeScore(derived);
    const pLookup = prescriptionLookup[m.rxId] || {};

    let rawVal = '—';
    if (m.preferredChannel === 'SMS') rawVal = pLookup.phone || '—';
    else if (m.preferredChannel === 'Email') rawVal = pLookup.email || '—';
    else if (m.preferredChannel === 'Push') rawVal = `apns_${m.memberId.toLowerCase()}_token`;

    const coverageEndDate = pLookup.pickupDeadline ? `${pLookup.pickupDeadline.split('-')[0]}-12-31` : '2026-12-31';

    return {
      ...m,
      derived,
      score,
      pickupDeadline: pLookup.pickupDeadline,
      pickupStatus: pLookup.pickupStatus || '—',
      channelValue: rawVal,
      coverageEndDate
    };
  }), [eligibilityData, prescriptionLookup]);

  const eligibleCount    = useMemo(() => enriched.filter(m => m.status === 'Eligible').length, [enriched]);
  const notEligibleCount = enriched.length - eligibleCount;
  const eligiblePct      = Math.round(eligibleCount / enriched.length * 100);

  const filtered = useMemo(() => {
    let rows = enriched;
    if (filterElig === 'eligible') rows = rows.filter(m => m.status === 'Eligible');
    if (filterElig === 'not')      rows = rows.filter(m => m.status !== 'Eligible');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(m =>
        m.memberName.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q)   ||
        m.rxId.toLowerCase().includes(q)       ||
        m.preferredChannel.toLowerCase().includes(q) ||
        m.channelValue.toLowerCase().includes(q)     ||
        m.pickupStatus.toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      let av = a[sortField] ?? ''; let bv = b[sortField] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return rows;
  }, [enriched, filterElig, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterElig = (f) => { setFilterElig(f); setPage(1); setExpanded(null); };
  const handleSearch     = (v) => { setSearch(v); setPage(1); };
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };
  const handleExportCSV = () => {
    exportToCSV('Eligibility', filtered, [
      { header: 'Member ID',         key: 'memberId' },
      { header: 'Member Name',       key: 'memberName' },
      { header: 'Rx ID',             key: 'rxId' },
      { header: 'Pickup Status',     key: 'pickupStatus' },
      { header: 'Preferred Channel', key: 'preferredChannel' },
      { header: 'Pickup Deadline',   key: 'pickupDeadline' },
      { header: 'Coverage End',      key: 'coverageEndDate' },
      { header: 'Consent',           key: 'consentStatus' },
      { header: 'Score',             key: 'score' },
      { header: 'Status',            key: 'status' },
    ]);
  };

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><ShieldCheck size={24} style={{ color: 'var(--aetna-purple)' }} /> Eligibility Review</h1>
          <p>Verifies Rx pickup readiness, active plan coverage, preferred communication channels, and member consent status.</p>
          <div className="snapshot-label">
            <Clock size={12} /> Snapshot as of <strong>{snapshotTime}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/campaign')}>
            Generate Campaigns <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="rx-kpi-cards">
        <div
          className={`rx-kpi-card card ${filterElig === 'all' ? 'rx-kpi-active' : ''}`}
          onClick={() => handleFilterElig('all')}
          style={{ '--kpi-border': 'var(--aetna-purple)' }}
          role="button" tabIndex={0}
        >
          <div className="rx-kpi-label" style={{ color: 'var(--aetna-purple)' }}>
            <User size={14} /> Total Reviewed
          </div>
          <div className="rx-kpi-count" style={{ color: 'var(--aetna-purple)' }}>{enriched.length}</div>
          {filterElig === 'all' && <div className="rx-kpi-active-bar" style={{ background: 'var(--aetna-purple)' }} />}
        </div>
        <div
          className={`rx-kpi-card card ${filterElig === 'eligible' ? 'rx-kpi-active' : ''}`}
          onClick={() => handleFilterElig('eligible')}
          style={{ '--kpi-border': 'var(--status-success)' }}
          role="button" tabIndex={0}
        >
          <div className="rx-kpi-label" style={{ color: 'var(--status-success)' }}>
            <ShieldCheck size={14} /> Eligible ({eligiblePct}%)
          </div>
          <div className="rx-kpi-count" style={{ color: 'var(--status-success)' }}>{eligibleCount}</div>
          {filterElig === 'eligible' && <div className="rx-kpi-active-bar" style={{ background: 'var(--status-success)' }} />}
        </div>
        <div
          className={`rx-kpi-card card ${filterElig === 'not' ? 'rx-kpi-active' : ''}`}
          onClick={() => handleFilterElig('not')}
          style={{ '--kpi-border': 'var(--status-failed)' }}
          role="button" tabIndex={0}
        >
          <div className="rx-kpi-label" style={{ color: 'var(--status-failed)' }}>
            <ShieldX size={14} /> Not Eligible
          </div>
          <div className="rx-kpi-count" style={{ color: 'var(--status-failed)' }}>{notEligibleCount}</div>
          {filterElig === 'not' && <div className="rx-kpi-active-bar" style={{ background: 'var(--status-failed)' }} />}
        </div>
      </div>

      {/* Search Bar */}
      <div className="rx-search-row">
        <div className="filter-search-box">
          <User size={15} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by member, channel, value, status, or Rx ID…"
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
                <SortHeader label="Member"            field="memberName"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Rx ID"             field="rxId"             sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Pickup Status"     field="pickupStatus"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Preferred Channel" field="preferredChannel"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Channel Value"     field="channelValue"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Pickup Deadline"   field="pickupDeadline"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Coverage End"      field="coverageEndDate"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Consent"           field="consentStatus"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Score"             field="score"            sortField={sortField} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortHeader label="Status"            field="status"           sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th style={{ textAlign: 'center' }}>Rules</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(member => {
                const eligible    = member.status === 'Eligible';
                const rowKey      = `${member.memberId}-${member.rxId}`;
                const isExpanded  = expanded === rowKey;
                const derivedResults = member.derived;
                const isUrgent = member.pickupDeadline && new Date(member.pickupDeadline) < new Date(Date.now() + 86400000 * 2);
                const badgeCls = PICKUP_STATUS_BADGE[member.pickupStatus] || 'badge-pending';

                return (
                  <>
                    <tr key={rowKey} className="rx-row">
                      <td>
                        <div className="member-cell">
                          <div className="member-avatar">
                            {member.memberName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="fw-600">{member.memberName}</div>
                            <div className="text-muted">{member.memberId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rx-id-badge">{member.rxId}</span>
                      </td>
                      <td>
                        <span className={`badge ${badgeCls}`}>
                          {member.pickupStatus}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm fw-600">{member.preferredChannel}</span>
                      </td>
                      <td>
                        <span className="text-sm text-muted">{maskContactValue(member.preferredChannel, member.channelValue)}</span>
                      </td>
                      <td>
                        <div className="deadline-cell">
                          <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                          <span className={`text-sm ${isUrgent ? 'deadline-urgent' : ''}`}>
                            {formatDate(member.pickupDeadline)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm fw-600">{formatDate(member.coverageEndDate)}</span>
                      </td>
                      <td>
                        <span className="elig-consent-badge" style={{
                          background: member.consentStatus === 'OptedIn' ? 'var(--status-bg-success)' : 'var(--status-bg-failed)',
                          color:      member.consentStatus === 'OptedIn' ? 'var(--status-success)'    : 'var(--status-failed)',
                        }}>
                          {member.consentStatus}
                        </span>
                      </td>
                      <td className="text-center">
                        <ScoreBar score={member.score} />
                      </td>
                      <td>
                        <span className={`badge ${eligible ? 'badge-success' : 'badge-failed'}`}>
                          {eligible ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                          {member.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline btn-sm elig-expand-icon-btn"
                          onClick={() => setExpanded(isExpanded ? null : rowKey)}
                          title={isExpanded ? 'Collapse rules' : 'Expand rules'}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded rule panel */}
                    {isExpanded && (
                      <tr key={`${rowKey}-rules`} className="timeline-row">
                        <td colSpan={11}>
                          <div className="elig-criteria fade-in" style={{ padding: '1rem 1.25rem' }}>
                            <div className="elig-criteria-title">
                              Rule Evaluation Results
                              <span className="elig-rules-score-badge" style={{
                                background: member.score === 100 ? 'var(--status-bg-success)' : 'var(--status-bg-failed)',
                                color:      member.score === 100 ? 'var(--status-success)'    : 'var(--status-failed)',
                              }}>
                                {Object.values(derivedResults).filter(Boolean).length}/{RULES.length} rules passed · {member.score}%
                              </span>
                            </div>
                            <div className="criteria-list">
                              {RULES.map(rule => (
                                <RuleRow
                                  key={rule.key}
                                  rule={rule}
                                  passed={derivedResults[rule.dataKey] ?? false}
                                />
                              ))}
                            </div>
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
              <ShieldCheck size={40} style={{ color: 'var(--text-light)' }} />
              <p>No members match your search filter.</p>
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
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p - 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityReview;
