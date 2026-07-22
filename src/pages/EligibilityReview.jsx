import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eligibilityData } from '../data/mockData';
import {
  ShieldCheck, ShieldX, CheckCircle2, XCircle, ArrowRight,
  ArrowLeft, User, Pill, ChevronDown, ChevronUp, Info, Tag
} from 'lucide-react';
import './EligibilityReview.css';

const RULE_LABELS = {
  ready_for_pickup:                 'Ready for Pickup',
  communication_preference_exists:  'Communication Preference Exists',
  active_member:                    'Active Member',
  opted_in:                         'Not Opted Out (Consent = OptedIn)',
};

const RULE_DETAILS = {
  ready_for_pickup:                 'Prescription must be available at CVS store (ready_for_pickup = Y)',
  communication_preference_exists:  'Member must have at least one valid comm channel registered',
  active_member:                    'Member must be active in the Aetna health plan',
  opted_in:                         'Member consent_status = OptedIn (not OptedOut)',
};

const REASON_LABELS = {
  NOT_READY:      'Prescription not yet ready for pickup',
  NO_COMM_PREF:   'No communication preference registered',
  OPTED_OUT:      'Member has opted out of notifications',
};

const CriteriaRow = ({ ruleKey, passed }) => (
  <div className={`check-item ${passed ? 'pass' : 'fail'}`}>
    <div className="check-icon">
      {passed
        ? <CheckCircle2 size={18} color="var(--status-success)" />
        : <XCircle     size={18} color="var(--status-failed)" />}
    </div>
    <div className="check-text">
      <span className="check-label">{RULE_LABELS[ruleKey] || ruleKey}</span>
      <span className="check-detail">{RULE_DETAILS[ruleKey]}</span>
    </div>
    <span className={`check-result ${passed ? 'pass' : 'fail'}`}>{passed ? 'Pass' : 'Fail'}</span>
  </div>
);

const ScoreBar = ({ score }) => {
  const color = score >= 80 ? 'var(--status-success)'
              : score >= 50 ? 'var(--status-pending)'
              :               'var(--status-failed)';
  return (
    <div className="score-bar-wrapper">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="score-label" style={{ color }}>{score}%</span>
    </div>
  );
};

const EligibilityCard = ({ member }) => {
  const [expanded, setExpanded] = useState(false);
  const eligible = member.status === 'Eligible';

  return (
    <div className={`elig-card card ${eligible ? 'elig-eligible' : 'elig-not-eligible'}`}>
      {/* Card Header */}
      <div className="elig-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="elig-member-info">
          <div className="elig-avatar">{member.memberName.split(' ').map(n=>n[0]).join('')}</div>
          <div>
            <div className="elig-member-name">{member.memberName}</div>
            <div className="elig-member-sub">
              <Pill size={12} /> {member.drug} &nbsp;·&nbsp;
              <User size={12} /> {member.memberId}
              {member.planType && <>&nbsp;·&nbsp;<Tag size={12} /> {member.planType}</>}
            </div>
          </div>
        </div>

        <div className="elig-card-right">
          <div className="elig-channel-badge">
            {member.preferredChannel}
          </div>
          <div className="elig-consent-badge" style={{
            background: member.consentStatus === 'OptedIn' ? 'var(--status-bg-success)' : 'var(--status-bg-failed)',
            color: member.consentStatus === 'OptedIn' ? 'var(--status-success)' : 'var(--status-failed)',
          }}>
            {member.consentStatus}
          </div>
          <ScoreBar score={member.eligibilityScore} />
          <span className={`badge ${eligible ? 'badge-success' : 'badge-failed'} elig-status-badge`}>
            {eligible
              ? <><ShieldCheck size={13} /> Eligible</>
              : <><ShieldX size={13} /> Not Eligible</>}
          </span>
          <button className="elig-expand-btn">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Rule Results */}
      {expanded && (
        <div className="elig-criteria fade-in">
          <div className="elig-criteria-title">
            <Info size={14} /> Eligibility Rule Results (rule_results_json)
          </div>
          <div className="criteria-list">
            {member.ruleResults && Object.entries(member.ruleResults).map(([key, passed]) => (
              <CriteriaRow key={key} ruleKey={key} passed={passed} />
            ))}
          </div>

          {/* Reason Code */}
          {!eligible && member.reasonCode && (
            <div className="elig-reason-code">
              <Tag size={13} />
              <span><strong>reason_code:</strong> {member.reasonCode}</span>
              <span className="reason-desc">{REASON_LABELS[member.reasonCode]}</span>
            </div>
          )}

          {eligible ? (
            <div className="elig-conclusion success">
              ✅ <strong>eligible_flag: true</strong> — All criteria met. Member will receive a {member.preferredChannel} notification.
            </div>
          ) : (
            <div className="elig-conclusion fail">
              ❌ <strong>eligible_flag: false</strong> — One or more criteria failed. Notification suppressed.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EligibilityReview = () => {
  const navigate = useNavigate();
  const [filterElig, setFilterElig] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = eligibilityData.filter(m => {
    const matchStatus =
      filterElig === 'all' ||
      (filterElig === 'eligible' && m.status === 'Eligible') ||
      (filterElig === 'not' && m.status !== 'Eligible');
    const matchSearch =
      !search ||
      m.memberName.toLowerCase().includes(search.toLowerCase()) ||
      m.memberId.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const eligibleCount    = eligibilityData.filter(m => m.status === 'Eligible').length;
  const notEligibleCount = eligibilityData.length - eligibleCount;
  const eligiblePct      = Math.round(eligibleCount / eligibilityData.length * 100);

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><ShieldCheck size={24} style={{ color: 'var(--aetna-purple)' }} /> Eligibility Review</h1>
          <p>Evaluate member eligibility for pickup notifications based on ERD rules: ready_for_pickup, comm preference, active member, and consent status.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/campaign')}>
            Generate Campaigns <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-3 mb-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card elig-stat-card">
          <div className="elig-stat-icon" style={{ background: 'var(--aetna-purple-light)', color: 'var(--aetna-purple)' }}>
            <User size={20} />
          </div>
          <div>
            <div className="elig-stat-label">Total Reviewed</div>
            <div className="elig-stat-value">{eligibilityData.length}</div>
          </div>
        </div>
        <div className="card elig-stat-card">
          <div className="elig-stat-icon" style={{ background: 'var(--status-bg-success)', color: 'var(--status-success)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="elig-stat-label">Eligible ({eligiblePct}%)</div>
            <div className="elig-stat-value" style={{ color: 'var(--status-success)' }}>{eligibleCount}</div>
          </div>
        </div>
        <div className="card elig-stat-card">
          <div className="elig-stat-icon" style={{ background: 'var(--status-bg-failed)', color: 'var(--status-failed)' }}>
            <ShieldX size={20} />
          </div>
          <div>
            <div className="elig-stat-label">Not Eligible</div>
            <div className="elig-stat-value" style={{ color: 'var(--status-failed)' }}>{notEligibleCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="elig-filter-row">
        <span className="elig-filter-label">Show:</span>
        {['all', 'eligible', 'not'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filterElig === f ? 'active' : ''}`}
            onClick={() => setFilterElig(f)}
          >
            {f === 'all' ? 'All Members' : f === 'eligible' ? '✅ Eligible' : '❌ Not Eligible'}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search member…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="filter-search-input elig-search"
          style={{ marginLeft: '0.5rem', maxWidth: '200px' }}
        />
        <span className="filter-info" style={{ marginLeft: 'auto' }}>
          <Info size={13} /> {filtered.length} members shown
        </span>
      </div>

      {/* Eligibility Cards */}
      <div className="elig-cards-list">
        {filtered.map(member => (
          <EligibilityCard key={`${member.memberId}-${member.rxId}`} member={member} />
        ))}
      </div>
    </div>
  );
};

export default EligibilityReview;
