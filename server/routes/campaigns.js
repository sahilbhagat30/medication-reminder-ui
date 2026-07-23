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

export default router;
