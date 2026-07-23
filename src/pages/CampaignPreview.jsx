import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCampaigns } from '../services/api';
import {
  Megaphone, Mail, MessageSquare, Bell, ArrowRight, ArrowLeft,
  Send, Eye, Calendar, User, Pill, Store, CheckCircle2, Clock, Key, FileText
} from 'lucide-react';
import './CampaignPreview.css';

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
};
const snapshotTime = formatTimestamp();

const channelConfig = {
  'SMS':   { icon: MessageSquare, color: '#2563EB', bg: '#EFF6FF', label: 'SMS Text Message' },
  'Email': { icon: Mail,          color: '#059669', bg: '#ECFDF5', label: 'Email Notification' },
  'Push':  { icon: Bell,          color: '#7C3AED', bg: '#F5F3FF', label: 'Push Notification' },
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

const CAMPAIGN_STATUS_CFG = {
  'Active':    { badge: 'badge-sent',    label: 'Active' },
  'Sent':      { badge: 'badge-success', label: 'Sent' },
  'Delivered': { badge: 'badge-success', label: 'Delivered' },
  'Completed': { badge: 'badge-success', label: 'Completed' },
  'Cancelled': { badge: 'badge-failed',  label: 'Cancelled' },
};

const PAGE_SIZE = 12;

const CampaignCard = ({ campaign, onSend }) => {
  const [previewing, setPreviewing] = useState(false);
  const channel = channelConfig[campaign.channel] || channelConfig['SMS'];
  const ChannelIcon = channel.icon;
  const status = CAMPAIGN_STATUS_CFG[campaign.status] || CAMPAIGN_STATUS_CFG['Active'];

  return (
    <div className="campaign-card card fade-in">
      {/* Header */}
      <div className="campaign-card-header">
        <div className="campaign-channel-badge" style={{ background: channel.bg, color: channel.color }}>
          <ChannelIcon size={16} />
          <span>{channel.label}</span>
        </div>
        <span className={`badge ${status.badge}`}>{status.label}</span>
      </div>

      {/* Member Info */}
      <div className="campaign-member-row">
        <div className="campaign-avatar">{campaign.memberName.split(' ').map(n=>n[0]).join('')}</div>
        <div>
          <div className="campaign-member-name">{campaign.memberName}</div>
          <div className="campaign-member-sub">
            <User size={11} /> {campaign.memberId} &nbsp;·&nbsp;
            <Pill size={11} /> {maskText(campaign.drug)}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="campaign-meta">
        <div className="meta-item">
          <Store size={13} style={{ color: 'var(--text-secondary)' }} />
          <span>{campaign.storeName || campaign.store}</span>
        </div>
        <div className="meta-item">
          <Calendar size={13} style={{ color: 'var(--status-pending)' }} />
          <span>Pickup by: <strong>{campaign.pickupDeadline}</strong></span>
        </div>
        <div className="meta-item">
          <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
          <span>Scheduled: {campaign.scheduledTime}</span>
        </div>
        <div className="meta-item">
          <Key size={13} style={{ color: 'var(--aetna-purple)' }} />
          <span className="idempotency-key">{campaign.idempotencyKey}</span>
        </div>
      </div>

      {/* Template Info */}
      <div className="campaign-template-row">
        <FileText size={13} style={{ color: 'var(--text-secondary)' }} />
        <span className="template-label">{campaign.templateName}</span>
        <span className="template-version">{campaign.templateVersion}</span>
        <span className="reminder-seq">Reminder #{campaign.reminderSequence}</span>
      </div>

      {/* Message Preview */}
      {previewing && (
        <div className="campaign-message-box fade-in" style={{ borderColor: channel.color }}>
          <div className="msg-header" style={{ color: channel.color }}>
            <ChannelIcon size={14} /> {channel.label} Preview
          </div>
          <div className="campaign-id-line">
            Campaign ID: <strong>{campaign.campaignId}</strong> &nbsp;·&nbsp; Template: <strong>{campaign.templateId}</strong>
          </div>
          {campaign.subject && (
            <div className="msg-subject"><strong>Subject:</strong> {campaign.subject}</div>
          )}
          <p className="msg-body" style={{ whiteSpace: 'pre-line' }}>{campaign.message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="campaign-actions">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setPreviewing(!previewing)}
        >
          <Eye size={14} /> {previewing ? 'Hide' : 'Preview'} Message
        </button>
        <button
          className={`btn btn-sm ${campaign.status === 'Active' ? 'btn-magenta' : 'btn-outline'}`}
          onClick={() => onSend(campaign.campaignId)}
          disabled={campaign.status !== 'Active'}
        >
          {campaign.status === 'Active'
            ? <><Send size={13} /> Send Now</>
            : <><CheckCircle2 size={13} /> {campaign.status}</>
          }
        </button>
      </div>
    </div>
  );
};

const CampaignPreview = () => {
  const navigate  = useNavigate();
  const [campaignList, setCampaignList] = useState([]);
  const [channelFilter, setChannelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns().then(data => {
      setCampaignList(data);
      setLoading(false);
    });
  }, []);

  const [sentCount, setSentCount] = useState(0);

  const handleSend = (id) => {
    setCampaignList(prev =>
      prev.map(c => c.campaignId === id ? { ...c, status: 'Sent' } : c)
    );
    setSentCount(prev => prev + 1);
  };

  const handleSendAll = () => {
    setCampaignList(prev => prev.map(c => ({ ...c, status: 'Sent' })));
    setSentCount(campaignList.length);
  };

  const filtered = campaignList.filter(c =>
    channelFilter === 'all' || c.channel === channelFilter
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const pendingCount = campaignList.filter(c => c.status === 'Active').length;

  const channelCounts = ['SMS', 'Email', 'Push'].map(ch => ({
    ch, count: campaignList.filter(c => c.channel === ch).length,
  }));

  return (
    <div className="page fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header">
          <h1><Megaphone size={24} style={{ color: 'var(--aetna-purple)' }} /> Campaign Preview</h1>
          <p>Review and dispatch notification campaigns for eligible members across SMS, Email, and Push channels.</p>
          <div className="snapshot-label">
            <Clock size={12} /> Snapshot as of <strong>{snapshotTime}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => navigate('/eligibility')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-magenta" onClick={handleSendAll} disabled={pendingCount === 0}>
            <Send size={15} /> Send All ({pendingCount} pending)
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/communication')}>
            View Status <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="rx-kpi-cards">
        <div
          className={`rx-kpi-card card ${channelFilter === 'all' ? 'rx-kpi-active' : ''}`}
          onClick={() => { setChannelFilter('all'); setPage(1); }}
          style={{ '--kpi-border': 'var(--aetna-purple)' }}
          role="button" tabIndex={0}
        >
          <div className="rx-kpi-label" style={{ color: 'var(--aetna-purple)' }}>Total Campaigns</div>
          <div className="rx-kpi-count" style={{ color: 'var(--aetna-purple)' }}>{campaignList.length}</div>
          {channelFilter === 'all' && <div className="rx-kpi-active-bar" style={{ background: 'var(--aetna-purple)' }} />}
        </div>
        <div className="rx-kpi-card card" style={{ '--kpi-border': 'var(--status-success)' }}>
          <div className="rx-kpi-label" style={{ color: 'var(--status-success)' }}>Sent</div>
          <div className="rx-kpi-count" style={{ color: 'var(--status-success)' }}>{sentCount}</div>
        </div>
        <div className="rx-kpi-card card" style={{ '--kpi-border': 'var(--status-pending)' }}>
          <div className="rx-kpi-label" style={{ color: 'var(--status-pending)' }}>Pending</div>
          <div className="rx-kpi-count" style={{ color: 'var(--status-pending)' }}>{pendingCount}</div>
        </div>
        {channelCounts.map(({ ch, count }) => {
          const cfg = channelConfig[ch];
          const Icon = cfg.icon;
          const isActive = channelFilter === ch;
          return (
            <div
              key={ch}
              className={`rx-kpi-card card ${isActive ? 'rx-kpi-active' : ''}`}
              onClick={() => { setChannelFilter(ch); setPage(1); }}
              style={{ '--kpi-border': cfg.color }}
              role="button" tabIndex={0}
            >
              <div className="rx-kpi-label" style={{ color: cfg.color }}>
                <Icon size={14} /> {ch}
              </div>
              <div className="rx-kpi-count" style={{ color: cfg.color }}>{count}</div>
              {isActive && <div className="rx-kpi-active-bar" style={{ background: cfg.color }} />}
            </div>
          );
        })}
      </div>

      {/* Campaign Cards Grid */}
      <div className="campaign-cards-grid">
        {paginated.map(c => (
          <CampaignCard key={c.campaignId} campaign={c} onSend={handleSend} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-row" style={{ marginTop: '1.5rem' }}>
          <span className="pagination-info">
            Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button className="btn btn-outline btn-sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i+1 : page-2+i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} className={`btn btn-sm ${p===page?'btn-primary':'btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="btn btn-outline btn-sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>›</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignPreview;
