// server/routes.js — All BFF API routes
import { Router } from 'express';
import pool from './db/pool.js';

const router = Router();

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 1. Prescriptions ──────────────────────────────────────────────────────────
// GET /api/prescriptions?status=Pending+Pickup&search=eliquis&page=1&limit=15
router.get('/prescriptions', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 200 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [];

    if (status && status !== 'All') {
      params.push(status);
      conditions.push(`pickup_status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const n = params.length;
      conditions.push(`(LOWER(member_name) LIKE $${n} OR LOWER(drug_name) LIKE $${n} OR LOWER(rx_id) LIKE $${n} OR LOWER(member_id) LIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
         rx_id            AS "id",
         member_id        AS "memberId",
         member_name      AS "memberName",
         drug_name        AS "drugName",
         drug_strength    AS "drugStrength",
         drug,
         TO_CHAR(prescription_date, 'YYYY-MM-DD') AS "prescriptionDate",
         TO_CHAR(fill_date,         'YYYY-MM-DD') AS "fillDate",
         TO_CHAR(pickup_deadline,   'YYYY-MM-DD') AS "pickupDeadline",
         pickup_status    AS "pickupStatus",
         ready_for_pickup AS "readyForPickup",
         store_id         AS "storeId",
         store_name       AS "storeName",
         store_address    AS "storeAddress",
         prescriber_id    AS "prescriberId",
         prescriber,
         specialty,
         plan_id          AS "planId",
         plan_name        AS "planName",
         plan_type        AS "planType",
         preferred_channel AS "preferredChannel",
         sms_permission   AS "smsPermission",
         email_permission AS "emailPermission",
         push_permission  AS "pushPermission",
         phone,
         email,
         city,
         state
       FROM prescription_fills
       ${where}
       ORDER BY rx_id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /prescriptions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 2. Eligibility ────────────────────────────────────────────────────────────
// GET /api/eligibility?status=Eligible&search=joseph
router.get('/eligibility', async (req, res) => {
  try {
    const { status, search } = req.query;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`eligibility_status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const n = params.length;
      conditions.push(`(LOWER(member_name) LIKE $${n} OR LOWER(member_id) LIKE $${n} OR LOWER(rx_id) LIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
         evaluation_id    AS "evaluationId",
         member_id        AS "memberId",
         member_name      AS "memberName",
         rx_id            AS "rxId",
         drug,
         ready_for_pickup AS "readyForPickup",
         comm_pref_exists AS "commPrefExists",
         active_member    AS "activeMember",
         opted_out        AS "optedOut",
         preferred_channel AS "preferredChannel",
         consent_status   AS "consentStatus",
         eligibility_status AS "status",
         eligibility_score  AS "eligibilityScore",
         reason_code      AS "reasonCode",
         rule_results     AS "ruleResults",
         plan_type        AS "planType",
         specialty
       FROM eligibility_evaluations
       ${where}
       ORDER BY member_id`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /eligibility error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 3. Campaigns ──────────────────────────────────────────────────────────────
// GET /api/campaigns?status=Active&search=eliquis
router.get('/campaigns', async (req, res) => {
  try {
    const { status, search } = req.query;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const n = params.length;
      conditions.push(`(LOWER(member_name) LIKE $${n} OR LOWER(drug) LIKE $${n} OR LOWER(campaign_id) LIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
         campaign_id       AS "id",
         member_id         AS "memberId",
         member_name       AS "memberName",
         drug,
         channel,
         store_name        AS "storeName",
         TO_CHAR(pickup_deadline, 'YYYY-MM-DD') AS "pickupDeadline",
         subject,
         message,
         status,
         campaign_status   AS "campaignStatus",
         TO_CHAR(scheduled_time, 'YYYY-MM-DD HH24:MI') AS "scheduledTime",
         idempotency_key   AS "idempotencyKey",
         template_id       AS "templateId",
         template_name     AS "templateName",
         reminder_sequence AS "reminderSequence"
       FROM campaigns
       ${where}
       ORDER BY campaign_id`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /campaigns error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 4. Communication Status ───────────────────────────────────────────────────
// GET /api/communications?status=Delivered&search=powell
router.get('/communications', async (req, res) => {
  try {
    const { status, search } = req.query;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const n = params.length;
      conditions.push(`(LOWER(member_name) LIKE $${n} OR LOWER(notif_id) LIKE $${n} OR LOWER(member_id) LIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
         notif_id          AS "notifId",
         prescription_id   AS "prescriptionId",
         member_id         AS "memberId",
         member_name       AS "memberName",
         drug,
         channel,
         campaign_id       AS "campaignId",
         status,
         TO_CHAR(sent_at,      'YYYY-MM-DD HH12:MI AM') AS "sentAt",
         TO_CHAR(delivered_at, 'YYYY-MM-DD HH12:MI AM') AS "deliveredAt",
         TO_CHAR(pickup_deadline, 'YYYY-MM-DD')          AS "pickupDeadline",
         store_id          AS "storeId",
         store_name        AS "storeName",
         failure_reason    AS "failureReason",
         failure_code      AS "failureCode",
         retry_count       AS "retryCount",
         reminder_sequence AS "reminderSequence",
         suppression_reason AS "suppressionReason",
         preferred_channel AS "preferredChannel"
       FROM communication_logs
       ${where}
       ORDER BY notif_id`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /communications error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 5. Summary Metrics ────────────────────────────────────────────────────────
// GET /api/summary
router.get('/summary', async (req, res) => {
  try {
    const [rxResult, notifResult, campaignResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                                      AS total_prescriptions,
          COUNT(DISTINCT member_id)                                     AS total_members,
          COUNT(*) FILTER (WHERE pickup_status = 'Pending Pickup')      AS pending_pickups
        FROM prescription_fills
      `),
      pool.query(`
        SELECT
          COUNT(*)                                              AS notifications_sent,
          COUNT(*) FILTER (WHERE status = 'Delivered')         AS delivered_count,
          COUNT(*) FILTER (WHERE status = 'Sent')              AS sent_count,
          COUNT(*) FILTER (WHERE status = 'Failed')            AS failed_count,
          ROUND(
            COUNT(*) FILTER (WHERE status = 'Delivered') * 100.0 / NULLIF(COUNT(*), 0)
          )                                                     AS delivery_success_rate
        FROM communication_logs
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Active')   AS active_campaigns,
          COUNT(*)                                     AS total_campaigns
        FROM campaigns
      `),
      pool.query(`
        SELECT
          channel,
          COUNT(*)                                     AS sent,
          COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered,
          COUNT(*) FILTER (WHERE status = 'Failed')    AS failed
        FROM communication_logs
        GROUP BY channel
        ORDER BY channel
      `),
    ]);

    const rx   = rxResult.rows[0];
    const notif = notifResult.rows[0];
    const camp  = campaignResult.rows[0];

    res.json({
      totalPrescriptions:  Number(rx.total_prescriptions),
      totalMembers:        Number(rx.total_members),
      pendingPickups:      Number(rx.pending_pickups),
      eligibleMembers:     Number(rx.total_members),   // approximation for demo
      notificationsSent:   Number(notif.notifications_sent),
      deliveredCount:      Number(notif.delivered_count),
      sentCount:           Number(notif.sent_count),
      failedCount:         Number(notif.failed_count),
      deliverySuccessRate: Number(notif.delivery_success_rate) || 0,
      activeCampaigns:     Number(camp.active_campaigns),
      avgResponseTime:     '4.2 min',
    });
  } catch (err) {
    console.error('GET /summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
