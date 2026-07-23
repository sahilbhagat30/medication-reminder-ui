import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
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

export default router;
