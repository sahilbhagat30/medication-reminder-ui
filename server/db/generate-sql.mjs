/**
 * generate-sql.mjs
 * Run: node server/db/generate-sql.mjs
 * Generates: server/db/seed.sql  (ready to paste into Cloud SQL Studio)
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';

// Load the mock data via dynamic import of the JS module
const { prescriptions, eligibilityData, campaigns, communicationStatus, summaryMetrics } =
  await import('../../src/data/mockData.js');

// ── helpers ───────────────────────────────────────────────────────────────────
const q  = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const qb = (v) => v == null ? 'NULL' : (v ? 'TRUE' : 'FALSE');
const qi = (v) => v == null ? 'NULL' : Number(v);

const lines = [];
const push  = (...args) => lines.push(...args);

// ── DDL ───────────────────────────────────────────────────────────────────────
push(
`-- ============================================================
--  Medication Reminder Platform — Cloud SQL Studio Script
--  Run this ONCE inside Cloud SQL Studio on the medreminder DB
-- ============================================================

-- Drop tables in reverse FK order
DROP TABLE IF EXISTS communication_logs     CASCADE;
DROP TABLE IF EXISTS eligibility_evaluations CASCADE;
DROP TABLE IF EXISTS campaigns              CASCADE;
DROP TABLE IF EXISTS prescription_fills     CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 1. PRESCRIPTION_FILLS  (flat: member + fill + plan + store)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE prescription_fills (
    rx_id              VARCHAR(20)  PRIMARY KEY,
    member_id          VARCHAR(20)  NOT NULL,
    member_name        VARCHAR(120) NOT NULL,
    drug_name          VARCHAR(100) NOT NULL,
    drug_strength      VARCHAR(80),
    drug               VARCHAR(150),
    prescription_date  DATE,
    fill_date          DATE,
    pickup_deadline    DATE,
    pickup_status      VARCHAR(40)  NOT NULL,
    ready_for_pickup   BOOLEAN      NOT NULL DEFAULT FALSE,
    store_id           VARCHAR(20),
    store_name         VARCHAR(120),
    store_address      VARCHAR(200),
    prescriber_id      VARCHAR(20),
    prescriber         VARCHAR(100),
    specialty          VARCHAR(80),
    plan_id            VARCHAR(20),
    plan_name          VARCHAR(100),
    plan_type          VARCHAR(40),
    preferred_channel  VARCHAR(20),
    sms_permission     BOOLEAN      DEFAULT FALSE,
    email_permission   BOOLEAN      DEFAULT FALSE,
    push_permission    BOOLEAN      DEFAULT FALSE,
    phone              VARCHAR(30),
    email              VARCHAR(120),
    city               VARCHAR(80),
    state              VARCHAR(10)
);

-- ─────────────────────────────────────────────────────────────
-- 2. ELIGIBILITY_EVALUATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE eligibility_evaluations (
    evaluation_id      VARCHAR(30)  PRIMARY KEY,   -- e.g. EVAL-RX00001
    member_id          VARCHAR(20)  NOT NULL,
    member_name        VARCHAR(120) NOT NULL,
    rx_id              VARCHAR(20)  REFERENCES prescription_fills(rx_id),
    drug               VARCHAR(150),
    ready_for_pickup   BOOLEAN      DEFAULT FALSE,
    comm_pref_exists   BOOLEAN      DEFAULT FALSE,
    active_member      BOOLEAN      DEFAULT FALSE,
    opted_out          BOOLEAN      DEFAULT FALSE,
    preferred_channel  VARCHAR(20),
    consent_status     VARCHAR(40),
    eligibility_status VARCHAR(20)  NOT NULL,
    eligibility_score  INTEGER,
    reason_code        VARCHAR(100),
    rule_results       JSONB,
    plan_type          VARCHAR(40),
    specialty          VARCHAR(80)
);

-- ─────────────────────────────────────────────────────────────
-- 3. CAMPAIGNS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE campaigns (
    campaign_id        VARCHAR(30)  PRIMARY KEY,
    member_id          VARCHAR(20),
    member_name        VARCHAR(120),
    drug               VARCHAR(150),
    channel            VARCHAR(20),
    store_name         VARCHAR(120),
    pickup_deadline    DATE,
    subject            VARCHAR(200),
    message            TEXT,
    status             VARCHAR(30)  NOT NULL,
    campaign_status    VARCHAR(30),
    scheduled_time     TIMESTAMP,
    idempotency_key    VARCHAR(100),
    template_id        VARCHAR(30),
    template_name      VARCHAR(100),
    reminder_sequence  INTEGER      DEFAULT 1
);

-- ─────────────────────────────────────────────────────────────
-- 4. COMMUNICATION_LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE communication_logs (
    notif_id           VARCHAR(20)  PRIMARY KEY,
    prescription_id    VARCHAR(20)  REFERENCES prescription_fills(rx_id),
    member_id          VARCHAR(20)  NOT NULL,
    member_name        VARCHAR(120) NOT NULL,
    drug               VARCHAR(150),
    channel            VARCHAR(20)  NOT NULL,
    campaign_id        VARCHAR(30),
    status             VARCHAR(30)  NOT NULL,
    sent_at            TIMESTAMP,
    delivered_at       TIMESTAMP,
    pickup_deadline    DATE,
    store_id           VARCHAR(20),
    store_name         VARCHAR(120),
    failure_reason     TEXT,
    failure_code       VARCHAR(50),
    retry_count        INTEGER      DEFAULT 0,
    reminder_sequence  INTEGER      DEFAULT 1,
    suppression_reason TEXT,
    preferred_channel  VARCHAR(20)
);

-- Indexes for fast filter/sort
CREATE INDEX idx_fills_status     ON prescription_fills(pickup_status);
CREATE INDEX idx_fills_member     ON prescription_fills(member_id);
CREATE INDEX idx_elig_status      ON eligibility_evaluations(eligibility_status);
CREATE INDEX idx_logs_status      ON communication_logs(status);
CREATE INDEX idx_logs_member      ON communication_logs(member_id);
`);

// ── INSERT: prescription_fills ─────────────────────────────────────────────
push('', '-- ============================================================',
        '--  PRESCRIPTION FILLS  (' + prescriptions.length + ' rows)',
        '-- ============================================================');

const RX_CHUNK = 10;
for (let i = 0; i < prescriptions.length; i += RX_CHUNK) {
  const chunk = prescriptions.slice(i, i + RX_CHUNK);
  push('INSERT INTO prescription_fills (rx_id,member_id,member_name,drug_name,drug_strength,drug,prescription_date,fill_date,pickup_deadline,pickup_status,ready_for_pickup,store_id,store_name,store_address,prescriber_id,prescriber,specialty,plan_id,plan_name,plan_type,preferred_channel,sms_permission,email_permission,push_permission,phone,email,city,state) VALUES');
  const rows = chunk.map(r =>
    `  (${q(r.id)},${q(r.memberId)},${q(r.memberName)},${q(r.drugName)},${q(r.drugStrength)},${q(r.drug)},${q(r.prescriptionDate)},${q(r.fillDate)},${q(r.pickupDeadline)},${q(r.pickupStatus)},${qb(r.readyForPickup)},${q(r.storeId)},${q(r.storeName)},${q(r.storeAddress)},${q(r.prescriberId)},${q(r.prescriber)},${q(r.specialty)},${q(r.planId)},${q(r.planName)},${q(r.planType)},${q(r.preferredChannel)},${qb(r.smsPermission)},${qb(r.emailPermission)},${qb(r.pushPermission)},${q(r.phone)},${q(r.email)},${q(r.city)},${q(r.state)})`
  );
  push(rows.join(',\n') + '\nON CONFLICT (rx_id) DO NOTHING;', '');
}

// ── INSERT: eligibility_evaluations ───────────────────────────────────────
push('', '-- ============================================================',
        '--  ELIGIBILITY EVALUATIONS  (' + eligibilityData.length + ' rows)',
        '-- ============================================================');

for (let i = 0; i < eligibilityData.length; i += RX_CHUNK) {
  const chunk = eligibilityData.slice(i, i + RX_CHUNK);
  push('INSERT INTO eligibility_evaluations (evaluation_id,member_id,member_name,rx_id,drug,ready_for_pickup,comm_pref_exists,active_member,opted_out,preferred_channel,consent_status,eligibility_status,eligibility_score,reason_code,rule_results,plan_type,specialty) VALUES');
  const rows = chunk.map((r, idx) =>
    `  (${q('EVAL-' + r.rxId)},${q(r.memberId)},${q(r.memberName)},${q(r.rxId)},${q(r.drug)},${qb(r.readyForPickup)},${qb(r.commPrefExists)},${qb(r.activeMember)},${qb(r.optedOut)},${q(r.preferredChannel)},${q(r.consentStatus)},${q(r.status)},${qi(r.eligibilityScore)},${q(r.reasonCode)},${q(JSON.stringify(r.ruleResults))},${q(r.planType)},${q(r.specialty)})`
  );
  push(rows.join(',\n') + '\nON CONFLICT (evaluation_id) DO NOTHING;', '');
}

// ── INSERT: campaigns ──────────────────────────────────────────────────────
push('', '-- ============================================================',
        '--  CAMPAIGNS  (' + campaigns.length + ' rows)',
        '-- ============================================================');
push('INSERT INTO campaigns (campaign_id,member_id,member_name,drug,channel,store_name,pickup_deadline,subject,message,status,campaign_status,scheduled_time,idempotency_key,template_id,template_name,reminder_sequence) VALUES');
const campRows = campaigns.map(c => {
  const parseSched = (v) => {
    if (!v) return 'NULL';
    try { return q(v.replace(' AM','').replace(' PM','').trim()); } catch { return q(v); }
  };
  return `  (${q(c.campaignId)},${q(c.memberId)},${q(c.memberName)},${q(c.drug)},${q(c.channel)},${q(c.storeName)},${q(c.pickupDeadline)},${q(c.subject)},${q(c.message)},${q(c.status)},${q(c.campaignStatus)},${parseSched(c.scheduledTime)},${q(c.idempotencyKey)},${q(c.templateId)},${q(c.templateName)},${qi(c.reminderSequence)})`;
});
push(campRows.join(',\n') + '\nON CONFLICT (campaign_id) DO NOTHING;', '');

// ── INSERT: communication_logs ─────────────────────────────────────────────
push('', '-- ============================================================',
        '--  COMMUNICATION LOGS  (' + communicationStatus.length + ' rows)',
        '-- ============================================================');

for (let i = 0; i < communicationStatus.length; i += RX_CHUNK) {
  const chunk = communicationStatus.slice(i, i + RX_CHUNK);
  push('INSERT INTO communication_logs (notif_id,prescription_id,member_id,member_name,drug,channel,campaign_id,status,sent_at,delivered_at,pickup_deadline,store_id,store_name,failure_reason,failure_code,retry_count,reminder_sequence,suppression_reason,preferred_channel) VALUES');
  const rows = chunk.map(r => {
    const parseDT = (v) => {
      if (!v) return 'NULL';
      // "2026-07-14 09:00 AM" → timestamp literal
      try {
        const d = new Date(v.replace(' AM','').replace(' PM','').trim());
        return isNaN(d) ? q(v) : q(v.replace(' AM','').replace(' PM',''));
      } catch { return q(v); }
    };
    return `  (${q(r.notifId)},${q(r.prescriptionId)},${q(r.memberId)},${q(r.memberName)},${q(r.drug)},${q(r.channel)},${q(r.campaignId)},${q(r.status)},${parseDT(r.sentAt)},${parseDT(r.deliveredAt)},${q(r.pickupDeadline)},${q(r.storeId)},${q(r.storeName)},${q(r.failureReason)},${q(r.failureCode)},${qi(r.retryCount)},${qi(r.reminderSequence)},${q(r.suppressionReason)},${q(r.preferredChannel)})`;
  });
  push(rows.join(',\n') + '\nON CONFLICT (notif_id) DO NOTHING;', '');
}

push('', '-- Done! Run SELECT COUNT(*) FROM prescription_fills; to verify.');

writeFileSync('./server/db/seed.sql', lines.join('\n'), 'utf8');
console.log('✅  seed.sql written with:');
console.log('    prescription_fills:      ', prescriptions.length, 'rows');
console.log('    eligibility_evaluations: ', eligibilityData.length, 'rows');
console.log('    campaigns:               ', campaigns.length, 'rows');
console.log('    communication_logs:      ', communicationStatus.length, 'rows');
